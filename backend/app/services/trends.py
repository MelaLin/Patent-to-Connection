import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.core.config import settings

class TrendsService:
    def __init__(self):
        self.base_url = settings.PATENTSVIEW_BASE
    
    async def get_patent_trends(self, technology_area: str, days: int = 365) -> Dict:
        """Get patent filing trends for a specific technology area"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        params = {
            "q": f'patent_title:"{technology_area}"',
            "f": "patent_number,filing_date",
            "s": "filing_date desc",
            "o": 1000  # Get more results for trend analysis
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/patents", params=params)
            response.raise_for_status()
            data = response.json()
            
            # Process data to create trends
            monthly_counts = {}
            if "patents" in data:
                for patent in data["patents"]:
                    filing_date = patent.get("filing_date")
                    if filing_date:
                        month_key = filing_date[:7]  # YYYY-MM format
                        monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
            
            return {
                "technology_area": technology_area,
                "period_days": days,
                "monthly_trends": monthly_counts,
                "total_patents": len(data.get("patents", [])),
                "trend_direction": self._calculate_trend_direction(monthly_counts)
            }
    
    async def get_top_assignees(self, technology_area: str, limit: int = 10) -> List[Dict]:
        """Get top patent assignees in a technology area"""
        params = {
            "q": f'patent_title:"{technology_area}"',
            "f": "assignee_name",
            "s": "patent_date desc",
            "o": 1000
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/patents", params=params)
            response.raise_for_status()
            data = response.json()
            
            # Count assignees
            assignee_counts = {}
            if "patents" in data:
                for patent in data["patents"]:
                    assignee = patent.get("assignee_name")
                    if assignee:
                        assignee_counts[assignee] = assignee_counts.get(assignee, 0) + 1
            
            # Sort by count and return top results
            sorted_assignees = sorted(assignee_counts.items(), key=lambda x: x[1], reverse=True)
            return [
                {"assignee": assignee, "patent_count": count}
                for assignee, count in sorted_assignees[:limit]
            ]
    
    async def get_emerging_technologies(self, days: int = 90) -> List[Dict]:
        """Identify emerging technology trends based on recent patent filings"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # This would require more sophisticated analysis
        # For now, returning mock data
        return [
            {
                "technology": "Artificial Intelligence",
                "growth_rate": 45.2,
                "patent_count": 1250,
                "trend_score": 8.5
            },
            {
                "technology": "Blockchain",
                "growth_rate": 32.1,
                "patent_count": 890,
                "trend_score": 7.8
            },
            {
                "technology": "Quantum Computing",
                "growth_rate": 28.7,
                "patent_count": 456,
                "trend_score": 7.2
            }
        ]
    
    def _calculate_trend_direction(self, monthly_counts: Dict) -> str:
        """Calculate if trend is increasing, decreasing, or stable"""
        if len(monthly_counts) < 2:
            return "insufficient_data"
        
        sorted_months = sorted(monthly_counts.keys())
        recent_months = sorted_months[-3:]  # Last 3 months
        
        if len(recent_months) < 2:
            return "insufficient_data"
        
        recent_avg = sum(monthly_counts[month] for month in recent_months) / len(recent_months)
        earlier_avg = sum(monthly_counts[month] for month in sorted_months[:-3]) / max(1, len(sorted_months) - 3)
        
        if recent_avg > earlier_avg * 1.1:
            return "increasing"
        elif recent_avg < earlier_avg * 0.9:
            return "decreasing"
        else:
            return "stable"
