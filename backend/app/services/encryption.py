from cryptography.fernet import Fernet
import os
import base64
from typing import Optional

class EncryptionService:
    """Service for encrypting and decrypting sensitive data like API keys"""
    
    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)
    
    def _get_or_create_key(self) -> bytes:
        """Get existing encryption key or create a new one"""
        key_file = "database/encryption.key"
        
        # Create database directory if it doesn't exist
        os.makedirs("database", exist_ok=True)
        
        if os.path.exists(key_file):
            with open(key_file, "rb") as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_file, "wb") as f:
                f.write(key)
            return key
    
    def encrypt(self, data: str) -> str:
        """Encrypt a string and return base64 encoded result"""
        if not data:
            return ""
        
        encrypted_data = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt base64 encoded data and return original string"""
        if not encrypted_data:
            return ""
        
        try:
            decoded_data = base64.b64decode(encrypted_data.encode())
            decrypted_data = self.cipher.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception:
            return ""
    
    def is_encrypted(self, data: str) -> bool:
        """Check if data appears to be encrypted"""
        try:
            # Try to decode as base64 and decrypt
            decoded = base64.b64decode(data.encode())
            self.cipher.decrypt(decoded)
            return True
        except Exception:
            return False

# Global encryption service instance
encryption_service = EncryptionService()