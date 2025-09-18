import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

from crewai import LLM


@dataclass(frozen=True)
class ProviderConfig:
    """Static configuration for a supported LLM provider."""

    provider_id: str
    model: str
    api_key_env: Optional[str] = None
    supports_vision: bool = False
    base_url_env: Optional[str] = None
    default_base_url: Optional[str] = None
    model_env: Optional[str] = None
    requires_api_key: bool = True

    def validate(self, api_key_override: Optional[str] = None) -> None:
        if not self.requires_api_key:
            return

        if api_key_override:
            return

        if not self.api_key_env:
            raise ValueError(
                f"Provider '{self.provider_id}' is misconfigured. An API key environment variable is required."
            )

        if not os.getenv(self.api_key_env):
            raise ValueError(
                f"Missing API key for provider '{self.provider_id}'. Set {self.api_key_env} in the environment."
            )

    def _resolve_model(self) -> str:
        if self.model_env:
            return os.getenv(self.model_env, self.model)
        return self.model

    def _resolve_base_url(self) -> Optional[str]:
        if self.base_url_env:
            custom_base = os.getenv(self.base_url_env)
            if custom_base:
                return custom_base
        return self.default_base_url

    def create_llm(self, *, api_key_override: Optional[str] = None) -> LLM:
        self.validate(api_key_override)
        llm_kwargs: Dict[str, Any] = {"model": self._resolve_model()}

        if api_key_override:
            llm_kwargs["api_key"] = api_key_override
        elif self.api_key_env:
            api_key = os.getenv(self.api_key_env)
            if api_key:
                llm_kwargs["api_key"] = api_key

        base_url = self._resolve_base_url()
        if base_url:
            llm_kwargs["base_url"] = base_url

        return LLM(**llm_kwargs)


class ProviderConfigurationService:
    """Central lookup for provider defaults and LLM construction."""

    def __init__(self) -> None:
        self._default_provider = "openai"
        self._providers: Dict[str, ProviderConfig] = {
            "openai": ProviderConfig(
                provider_id="openai",
                model="openai/gpt-4.1-mini",
                api_key_env="OPENAI_API_KEY",
                supports_vision=True,
            ),
            "anthropic": ProviderConfig(
                provider_id="anthropic",
                model="anthropic/claude-3.5-sonnet",
                api_key_env="ANTHROPIC_API_KEY",
                supports_vision=False,
            ),
            "google": ProviderConfig(
                provider_id="google",
                model="google/gemini-2.0-flash-exp",
                api_key_env="GOOGLE_API_KEY",
                supports_vision=True,
            ),
            "lmstudio": ProviderConfig(
                provider_id="lmstudio",
                model="lmstudio",
                api_key_env="LMSTUDIO_API_KEY",
                base_url_env="LMSTUDIO_BASE_URL",
                default_base_url="http://localhost:1234/v1",
                model_env="LMSTUDIO_MODEL",
                supports_vision=False,
                requires_api_key=False,
            ),
        }

    def get_provider(self, provider_id: Optional[str]) -> ProviderConfig:
        key = (provider_id or self._default_provider).lower()
        if key not in self._providers:
            supported = ", ".join(sorted(self._providers.keys()))
            raise ValueError(f"Unsupported provider '{provider_id}'. Supported providers: {supported}.")
        return self._providers[key]

    @staticmethod
    def _normalise_lookup_key(value: str) -> str:
        return value.strip().lower().replace("-", "_")

    def _resolve_override_key(
        self,
        config: ProviderConfig,
        api_keys: Optional[Dict[str, str]],
    ) -> Optional[str]:
        if not api_keys:
            return None

        normalised: Dict[str, str] = {}
        for raw_key, raw_value in api_keys.items():
            if not isinstance(raw_value, str):
                continue
            value = raw_value.strip()
            if not value:
                continue
            normalised[self._normalise_lookup_key(raw_key)] = value

        if not normalised:
            return None

        candidate_keys = {
            self._normalise_lookup_key(config.provider_id),
            self._normalise_lookup_key(f"{config.provider_id}_api_key"),
        }
        if config.api_key_env:
            candidate_keys.add(self._normalise_lookup_key(config.api_key_env))

        for candidate in candidate_keys:
            if candidate in normalised:
                return normalised[candidate]

        return None

    def create_llm(
        self,
        provider_id: Optional[str],
        *,
        require_vision: bool = False,
        api_keys: Optional[Dict[str, str]] = None,
    ) -> LLM:
        config = self.get_provider(provider_id)
        if require_vision and not config.supports_vision:
            raise ValueError(f"Provider '{config.provider_id}' does not support vision-enabled workflows.")
        override_key = self._resolve_override_key(config, api_keys)
        return config.create_llm(api_key_override=override_key)

    @property
    def default_provider(self) -> str:
        return self._default_provider
