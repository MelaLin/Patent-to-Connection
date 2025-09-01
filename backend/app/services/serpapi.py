import httpx
import logging
import json
from typing import Dict, List, Optional
from fastapi import HTTPException
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)

class SerpAPIService:
    def __init__(self):
        self.api_key = settings.SERPAPI_API_KEY
        self.base_url = "https://serpapi.com/search"
    
    async def search_patents(self, query: str, limit: int = 10) -> List[Dict]:
        """Search for patents using SerpAPI"""
        logger.info(f"Searching patents with query: {query}, limit: {limit}")
        
        if not self.api_key:
            logger.error("SERPAPI_API_KEY not configured")
            raise HTTPException(
                status_code=500,
                detail="Missing SERPAPI_API_KEY"
            )
        
        params = {
            "api_key": self.api_key,
            "engine": "google_patents",
            "q": query,
            "num": limit
        }
        
        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Making request to SerpAPI: {self.base_url}")
                response = await client.get(self.base_url, params=params)
                
                # Log response status
                logger.info(f"SerpAPI response status: {response.status_code}")
                
                # Check if response is successful
                if response.status_code != 200:
                    error_detail = f"SerpAPI returned status {response.status_code}"
                    try:
                        error_data = response.json()
                        if "error" in error_data:
                            error_detail = f"SerpAPI error: {error_data['error']}"
                    except:
                        error_detail = f"SerpAPI returned status {response.status_code}: {response.text}"
                    
                    logger.error(f"SerpAPI request failed: {error_detail}")
                    raise HTTPException(
                        status_code=502,
                        detail=error_detail
                    )
                
                # Parse JSON response with error handling
                try:
                    data = response.json()
                except Exception as e:
                    logger.error(f"Failed to parse SerpAPI JSON response: {str(e)}")
                    logger.error(f"Raw response text: {response.text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to parse SerpAPI response: {str(e)}"
                    )
                
                # Log raw response when DEBUG is enabled
                if settings.DEBUG:
                    logger.debug(f"SerpAPI raw response: {json.dumps(data, indent=2)}")
                
                logger.info(f"SerpAPI response received, processing data")
                
                # Check if response contains an error field
                if "error" in data:
                    error_message = data.get("error", "Unknown SerpAPI error")
                    logger.error(f"SerpAPI returned error: {error_message}")
                    logger.error(f"Full SerpAPI error response: {json.dumps(data, indent=2)}")
                    raise HTTPException(
                        status_code=502,
                        detail=error_message
                    )
                
                # Safely check for organic_results
                organic_results = data.get("organic_results", [])
                if not organic_results:
                    logger.info(f"No organic_results found in SerpAPI response")
                    logger.info(f"Available keys in response: {list(data.keys())}")
                    # Return empty results instead of raising error
                    return []
                
                patents = []
                for result in organic_results:
                    try:
                        patent = {
                            "title": result.get("title", ""),
                            "snippet": result.get("snippet", ""),
                            "publication_date": result.get("publication_date", ""),
                            "inventor": result.get("inventor", ""),
                            "assignee": result.get("assignee", ""),
                            "patent_link": result.get("link", ""),
                            "pdf": result.get("pdf", "")
                        }
                        patents.append(patent)
                    except Exception as e:
                        logger.warning(f"Error processing patent result: {str(e)}")
                        continue
                
                logger.info(f"Found {len(patents)} patents")
                return patents
                
        except httpx.RequestError as e:
            logger.error(f"Network error when calling SerpAPI: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Network error when calling SerpAPI: {str(e)}"
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error when calling SerpAPI: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"HTTP error when calling SerpAPI: {str(e)}"
            )
        except HTTPException:
            # Re-raise HTTPExceptions as they already have proper status codes
            raise
        except Exception as e:
            logger.error(f"Unexpected error in SerpAPI search: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error in SerpAPI search: {str(e)}"
            )
    
    async def get_patent_details(self, patent_number: str) -> Optional[Dict]:
        """Get detailed information about a specific patent"""
        logger.info(f"Getting patent details for: {patent_number}")
        
        if not self.api_key:
            logger.error("SERPAPI_API_KEY not configured")
            raise HTTPException(
                status_code=500,
                detail="Missing SERPAPI_API_KEY"
            )
        
        params = {
            "api_key": self.api_key,
            "engine": "google_patents",
            "patent_number": patent_number
        }
        
        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Making request to SerpAPI for patent: {patent_number}")
                response = await client.get(self.base_url, params=params)
                
                # Log response status
                logger.info(f"SerpAPI response status: {response.status_code}")
                
                # Check if response is successful
                if response.status_code != 200:
                    error_detail = f"SerpAPI returned status {response.status_code}"
                    try:
                        error_data = response.json()
                        if "error" in error_data:
                            error_detail = f"SerpAPI error: {error_data['error']}"
                    except:
                        error_detail = f"SerpAPI returned status {response.status_code}: {response.text}"
                    
                    logger.error(f"SerpAPI request failed: {error_detail}")
                    raise HTTPException(
                        status_code=502,
                        detail=error_detail
                    )
                
                # Parse JSON response with error handling
                try:
                    data = response.json()
                except Exception as e:
                    logger.error(f"Failed to parse SerpAPI JSON response: {str(e)}")
                    logger.error(f"Raw response text: {response.text}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to parse SerpAPI response: {str(e)}"
                    )
                
                # Log raw response when DEBUG is enabled
                if settings.DEBUG:
                    logger.debug(f"SerpAPI raw response: {json.dumps(data, indent=2)}")
                
                logger.info(f"SerpAPI response received, processing data")
                
                # Check if response contains an error field
                if "error" in data:
                    error_message = data.get("error", "Unknown SerpAPI error")
                    logger.error(f"SerpAPI returned error: {error_message}")
                    logger.error(f"Full SerpAPI error response: {json.dumps(data, indent=2)}")
                    raise HTTPException(
                        status_code=502,
                        detail=error_message
                    )
                
                # Safely check for organic_results
                organic_results = data.get("organic_results", [])
                if not organic_results:
                    logger.info(f"No organic_results found in SerpAPI response")
                    logger.info(f"Available keys in response: {list(data.keys())}")
                    return None
                
                result = organic_results[0]
                logger.info(f"Found patent details for: {patent_number}")
                return {
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "publication_date": result.get("publication_date", ""),
                    "inventor": result.get("inventor", ""),
                    "assignee": result.get("assignee", ""),
                    "patent_link": result.get("link", ""),
                    "pdf": result.get("pdf", "")
                }
                
        except httpx.RequestError as e:
            logger.error(f"Network error when calling SerpAPI: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"Network error when calling SerpAPI: {str(e)}"
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error when calling SerpAPI: {str(e)}")
            raise HTTPException(
                status_code=502,
                detail=f"HTTP error when calling SerpAPI: {str(e)}"
            )
        except HTTPException:
            # Re-raise HTTPExceptions as they already have proper status codes
            raise
        except Exception as e:
            logger.error(f"Unexpected error in SerpAPI patent details: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected error in SerpAPI patent details: {str(e)}"
            )
