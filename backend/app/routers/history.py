from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..models.database import get_db
from ..models.schemas import HistoryResponse
from ..services.history_service import history_service
from typing import Optional

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/", response_model=HistoryResponse)
async def get_history(
    db: Session = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=100, description="Number of items to return"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip")
):
    """Get prompt generation history with pagination"""
    try:
        history_response = history_service.get_history(db, limit, offset)
        return history_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@router.get("/{generation_id}")
async def get_generation(
    generation_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific generation by ID"""
    try:
        if generation_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid generation ID")
        
        generation = history_service.get_generation_by_id(db, generation_id)
        
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        return {
            "success": True,
            "data": {
                "id": generation.id,
                "original_prompt": generation.original_prompt,
                "generated_output": generation.generated_output,
                "provider_used": generation.provider_used,
                "processing_time": generation.processing_time,
                "created_at": generation.created_at
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get generation: {str(e)}")

@router.delete("/{generation_id}")
async def delete_generation(
    generation_id: int,
    db: Session = Depends(get_db)
):
    """Delete a specific generation from history"""
    try:
        if generation_id <= 0:
            raise HTTPException(status_code=400, detail="Invalid generation ID")
        
        success = history_service.delete_generation(db, generation_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        return {
            "success": True,
            "message": f"Generation {generation_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete generation: {str(e)}")

@router.delete("/")
async def clear_history(db: Session = Depends(get_db)):
    """Clear all history"""
    try:
        deleted_count = history_service.clear_history(db)
        
        return {
            "success": True,
            "message": f"Cleared {deleted_count} items from history",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")

@router.get("/stats/summary")
async def get_history_stats(db: Session = Depends(get_db)):
    """Get history statistics"""
    try:
        # Get basic history info
        history_response = history_service.get_history(db, limit=1000, offset=0)
        
        if not history_response.success:
            raise HTTPException(status_code=500, detail="Failed to get history data")
        
        total_generations = history_response.total
        
        # Calculate statistics
        if total_generations == 0:
            return {
                "success": True,
                "stats": {
                    "total_generations": 0,
                    "average_processing_time": 0,
                    "most_used_provider": None,
                    "provider_usage": {},
                    "recent_activity": []
                }
            }
        
        # Calculate provider usage and average processing time
        provider_usage = {}
        total_processing_time = 0
        recent_activity = []
        
        for item in history_response.data:
            # Provider usage
            provider = item.provider_used
            provider_usage[provider] = provider_usage.get(provider, 0) + 1
            
            # Processing time
            total_processing_time += item.processing_time
            
            # Recent activity (last 10 items)
            if len(recent_activity) < 10:
                recent_activity.append({
                    "id": item.id,
                    "prompt_preview": item.original_prompt[:50] + "..." if len(item.original_prompt) > 50 else item.original_prompt,
                    "provider": item.provider_used,
                    "created_at": item.created_at
                })
        
        # Find most used provider
        most_used_provider = max(provider_usage.items(), key=lambda x: x[1])[0] if provider_usage else None
        
        # Calculate average processing time
        average_processing_time = total_processing_time / total_generations if total_generations > 0 else 0
        
        return {
            "success": True,
            "stats": {
                "total_generations": total_generations,
                "average_processing_time": round(average_processing_time, 2),
                "most_used_provider": most_used_provider,
                "provider_usage": provider_usage,
                "recent_activity": recent_activity
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history stats: {str(e)}")

@router.get("/search/prompts")
async def search_prompts(
    db: Session = Depends(get_db),
    query: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(default=20, ge=1, le=100, description="Number of results to return")
):
    """Search through prompt history"""
    try:
        # Get all history (this is a simple implementation - in production you'd want proper search)
        history_response = history_service.get_history(db, limit=1000, offset=0)
        
        if not history_response.success:
            raise HTTPException(status_code=500, detail="Failed to search history")
        
        # Filter results based on query
        query_lower = query.lower()
        filtered_results = []
        
        for item in history_response.data:
            if query_lower in item.original_prompt.lower():
                filtered_results.append({
                    "id": item.id,
                    "original_prompt": item.original_prompt,
                    "provider_used": item.provider_used,
                    "created_at": item.created_at,
                    "processing_time": item.processing_time
                })
                
                if len(filtered_results) >= limit:
                    break
        
        return {
            "success": True,
            "query": query,
            "results": filtered_results,
            "total_found": len(filtered_results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search prompts: {str(e)}")