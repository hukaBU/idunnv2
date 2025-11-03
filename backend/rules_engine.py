"""Wellness Brain - Core Intelligence Engine for Idunn
Cerveau n°1: Backend Rules Engine with Cross-Analysis
"""

from sqlalchemy.orm import Session
import models
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid

class Insight:
    """Wellness Insight Object"""
    def __init__(
        self,
        title: str,
        message: str,
        category: str,
        priority: str = 'normal',  # 'low', 'normal', 'high'
        recommended_product_id: Optional[str] = None,
        icon: str = 'information-circle'
    ):
        self.id = str(uuid.uuid4())
        self.title = title
        self.message = message
        self.category = category
        self.priority = priority
        self.recommended_product_id = recommended_product_id
        self.icon = icon
        self.timestamp = datetime.utcnow()
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'category': self.category,
            'priority': self.priority,
            'recommended_product_id': self.recommended_product_id,
            'icon': self.icon,
            'timestamp': self.timestamp.isoformat()
        }

class WellnessEngine:
    """Core Wellness Intelligence Engine"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_insights(self, user_id: str) -> List[Dict]:
        """
        Main intelligence function: Analyze user data and generate insights.
        
        Args:
            user_id: User's UUID
            
        Returns:
            List of insight dictionaries
        """
        insights = []
        
        # Fetch all user data
        user_data = self._fetch_user_data(user_id)
        
        # Run analysis modules
        insights.extend(self._analyze_sleep(user_data))
        insights.extend(self._analyze_hydration(user_data))
        insights.extend(self._analyze_stress(user_data))
        insights.extend(self._analyze_activity(user_data))
        insights.extend(self._cross_analyze(user_data))
        
        # Convert to dictionaries and sort by priority
        insight_dicts = [insight.to_dict() for insight in insights]
        
        # Sort: high priority first
        priority_order = {'high': 0, 'normal': 1, 'low': 2}
        insight_dicts.sort(key=lambda x: priority_order.get(x['priority'], 1))
        
        return insight_dicts
    
    def _fetch_user_data(self, user_id: str) -> Dict:
        """
        Fetch all relevant user data from database.
        """
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        today = datetime.utcnow().date()
        
        # Get health logs
        logs = self.db.query(models.HealthLog).filter(
            models.HealthLog.user_id == user_id,
            models.HealthLog.timestamp >= seven_days_ago
        ).all()
        
        # Organize by metric type
        data = {
            'sleep_logs': [log for log in logs if log.metric_type == 'sleep_hours'],
            'water_logs': [log for log in logs if log.metric_type == 'water_ml'],
            'stress_logs': [log for log in logs if log.metric_type == 'stress_level'],
            'steps_logs': [log for log in logs if log.metric_type == 'steps'],
            'heart_rate_logs': [log for log in logs if log.metric_type == 'heart_rate'],
        }
        
        # Get today's logs
        today_logs = self.db.query(models.HealthLog).filter(
            models.HealthLog.user_id == user_id,
            models.HealthLog.timestamp >= datetime.combine(today, datetime.min.time())
        ).all()
        
        data['today_logs'] = {
            'water': [log for log in today_logs if log.metric_type == 'water_ml'],
            'sleep': [log for log in today_logs if log.metric_type == 'sleep_hours'],
            'stress': [log for log in today_logs if log.metric_type == 'stress_level'],
            'steps': [log for log in today_logs if log.metric_type == 'steps'],
        }
        
        # Get connected wearables
        data['wearables'] = self.db.query(models.WearableConnection).filter(
            models.WearableConnection.user_id == user_id,
            models.WearableConnection.is_active == 1
        ).all()
        
        return data
    
    def _analyze_sleep(self, data: Dict) -> List[Insight]:
        """
        Analyze sleep patterns.
        """
        insights = []
        sleep_logs = data['sleep_logs']
        
        if not sleep_logs:
            return insights
        
        # Calculate average sleep
        avg_sleep = sum(log.value for log in sleep_logs) / len(sleep_logs)
        
        # Get magnesium product for recommendations
        magnesium = self.db.query(models.Product).filter(
            models.Product.name.ilike('%magnesium%')
        ).first()
        
        if avg_sleep < 6:
            insights.append(Insight(
                title="Alerte Sommeil",
                message=f"Votre moyenne de sommeil est de {avg_sleep:.1f}h sur 7 jours. Visez 7-9h pour une santé optimale. Le magnésium peut aider à améliorer la qualité du sommeil.",
                category="sleep",
                priority="high",
                recommended_product_id=str(magnesium.id) if magnesium else None,
                icon="moon"
            ))
        elif avg_sleep < 7:
            insights.append(Insight(
                title="Sommeil Améliorable",
                message=f"Vous dormez {avg_sleep:.1f}h en moyenne. Essayez de gagner 30-60 minutes supplémentaires pour atteindre l'optimal.",
                category="sleep",
                priority="normal",
                icon="moon"
            ))
        else:
            insights.append(Insight(
                title="Excellent Sommeil!",
                message=f"Bravo! Vous dormez {avg_sleep:.1f}h en moyenne. Continuez ainsi!",
                category="sleep",
                priority="low",
                icon="checkmark-circle"
            ))
        
        return insights
    
    def _analyze_hydration(self, data: Dict) -> List[Insight]:
        """
        Analyze hydration levels.
        """
        insights = []
        today_water = data['today_logs']['water']
        
        if not today_water:
            insights.append(Insight(
                title="Hydratation",
                message="N'oubliez pas de tracker votre consommation d'eau aujourd'hui! Objectif: 2000ml.",
                category="hydration",
                priority="normal",
                icon="water"
            ))
            return insights
        
        total_water = sum(log.value for log in today_water)
        
        if total_water < 1000:
            insights.append(Insight(
                title="Hydratation Faible",
                message=f"Vous n'avez bu que {int(total_water)}ml aujourd'hui. Essayez d'atteindre 2000ml!",
                category="hydration",
                priority="normal",
                icon="water"
            ))
        elif total_water < 2000:
            insights.append(Insight(
                title="Bon Progrès",
                message=f"Vous avez bu {int(total_water)}ml aujourd'hui. Encore un peu pour atteindre l'objectif!",
                category="hydration",
                priority="low",
                icon="water"
            ))
        else:
            insights.append(Insight(
                title="Excellente Hydratation!",
                message=f"Parfait! Vous avez bu {int(total_water)}ml aujourd'hui. Bien hydraté!",
                category="hydration",
                priority="low",
                icon="checkmark-circle"
            ))
        
        return insights
    
    def _analyze_stress(self, data: Dict) -> List[Insight]:
        """
        Analyze stress levels.
        """
        insights = []
        stress_logs = data['stress_logs']
        
        if not stress_logs:
            return insights
        
        # Recent stress (last 3 days)
        recent_stress = [log for log in stress_logs if 
                        log.timestamp >= datetime.utcnow() - timedelta(days=3)]
        
        if recent_stress:
            avg_stress = sum(log.value for log in recent_stress) / len(recent_stress)
            
            # Get meditation cushion for recommendations
            meditation = self.db.query(models.Product).filter(
                models.Product.name.ilike('%meditation%')
            ).first()
            
            if avg_stress > 7:
                insights.append(Insight(
                    title="Stress Élevé Détecté",
                    message=f"Votre niveau de stress moyen est de {avg_stress:.1f}/10. Prenez du temps pour vous relaxer. La méditation peut aider.",
                    category="stress",
                    priority="high",
                    recommended_product_id=str(meditation.id) if meditation else None,
                    icon="pulse"
                ))
            elif avg_stress > 5:
                insights.append(Insight(
                    title="Stress Modéré",
                    message=f"Votre stress est à {avg_stress:.1f}/10. Respirez profondément et prenez des pauses régulières.",
                    category="stress",
                    priority="normal",
                    icon="pulse"
                ))
        
        return insights
    
    def _analyze_activity(self, data: Dict) -> List[Insight]:
        """
        Analyze physical activity.
        """
        insights = []
        steps_logs = data['steps_logs']
        
        if not steps_logs:
            return insights
        
        avg_steps = sum(log.value for log in steps_logs) / len(steps_logs)
        
        # Get fitness products
        resistance_bands = self.db.query(models.Product).filter(
            models.Product.name.ilike('%resistance%')
        ).first()
        
        if avg_steps < 5000:
            insights.append(Insight(
                title="Activité Faible",
                message=f"Vous faites en moyenne {int(avg_steps)} pas/jour. Visez 8000-10000 pas pour une meilleure santé cardiovasculaire.",
                category="fitness",
                priority="normal",
                recommended_product_id=str(resistance_bands.id) if resistance_bands else None,
                icon="walk"
            ))
        elif avg_steps < 8000:
            insights.append(Insight(
                title="Bonne Activité",
                message=f"Vous faites {int(avg_steps)} pas/jour en moyenne. Excellent! Essayez d'atteindre 10000.",
                category="fitness",
                priority="low",
                icon="walk"
            ))
        
        return insights
    
    def _cross_analyze(self, data: Dict) -> List[Insight]:
        """
        Cross-analysis: Connect multiple data points for deeper insights.
        """
        insights = []
        
        sleep_logs = data['sleep_logs']
        stress_logs = data['stress_logs']
        steps_logs = data['steps_logs']
        
        # Cross-Analysis 1: Low sleep + High stress
        if sleep_logs and stress_logs:
            avg_sleep = sum(log.value for log in sleep_logs) / len(sleep_logs)
            recent_stress = [log for log in stress_logs if 
                           log.timestamp >= datetime.utcnow() - timedelta(days=3)]
            
            if recent_stress:
                avg_stress = sum(log.value for log in recent_stress) / len(recent_stress)
                
                if avg_sleep < 6 and avg_stress > 6:
                    insights.append(Insight(
                        title="Connexion Stress-Sommeil",
                        message="Votre stress élevé semble affecter votre sommeil. Essayez une séance de méditation avant le coucher.",
                        category="wellness",
                        priority="high",
                        icon="analytics"
                    ))
        
        # Cross-Analysis 2: Low activity + Poor sleep
        if sleep_logs and steps_logs:
            avg_sleep = sum(log.value for log in sleep_logs) / len(sleep_logs)
            avg_steps = sum(log.value for log in steps_logs) / len(steps_logs)
            
            if avg_sleep < 7 and avg_steps < 5000:
                insights.append(Insight(
                    title="Activité & Sommeil",
                    message="L'activité physique améliore le sommeil. Une marche de 20 minutes par jour pourrait vous aider.",
                    category="wellness",
                    priority="normal",
                    icon="analytics"
                ))
        
        # Cross-Analysis 3: Multiple wearables = Good data tracking
        if len(data['wearables']) > 1:
            insights.append(Insight(
                title="Excellent Suivi!",
                message=f"Vous avez connecté {len(data['wearables'])} appareils. Vos données sont complètes!",
                category="tracking",
                priority="low",
                icon="checkmark-circle"
            ))
        
        return insights

def get_wellness_insight(user_id: str, db: Session) -> str:
    """
    Legacy function for backward compatibility.
    Returns a single insight string.
    """
    engine = WellnessEngine(db)
    insights = engine.generate_insights(user_id)
    
    if not insights:
        return "Continuez à tracker vos données pour recevoir des insights personnalisés!"
    
    # Return the highest priority insight
    return insights[0]['message']

def get_hydration_insight(user_id: str, db: Session) -> str:
    """
    Legacy function for backward compatibility.
    Returns hydration insight string.
    """
    engine = WellnessEngine(db)
    insights = engine.generate_insights(user_id)
    
    hydration_insights = [i for i in insights if i['category'] == 'hydration']
    
    if not hydration_insights:
        return "N'oubliez pas de tracker votre eau!"
    
    return hydration_insights[0]['message']
