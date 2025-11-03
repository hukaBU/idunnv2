from sqlalchemy.orm import Session
from backend import models
from datetime import datetime, timedelta

def get_wellness_insight(user_id: str, db: Session):
    """
    Simple rules engine for wellness insights.
    This is a stub for MVP - will be replaced with more sophisticated logic.
    """
    # Get recent sleep logs (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    sleep_logs = db.query(models.HealthLog).filter(
        models.HealthLog.user_id == user_id,
        models.HealthLog.metric_type == 'sleep_hours',
        models.HealthLog.timestamp >= seven_days_ago
    ).all()
    
    if not sleep_logs:
        return "Start tracking your sleep to get personalized insights!"
    
    # Calculate average sleep
    avg_sleep = sum(log.value for log in sleep_logs) / len(sleep_logs)
    
    if avg_sleep < 6:
        return "You're averaging less than 6 hours of sleep. Consider going to bed earlier for better wellness."
    elif avg_sleep < 7:
        return "You're getting decent sleep, but aim for 7-9 hours for optimal wellness."
    else:
        return "Great job! You're getting good sleep. Keep it up!"

def get_hydration_insight(user_id: str, db: Session):
    """
    Simple hydration insights.
    """
    today = datetime.utcnow().date()
    water_logs = db.query(models.HealthLog).filter(
        models.HealthLog.user_id == user_id,
        models.HealthLog.metric_type == 'water_ml',
        models.HealthLog.timestamp >= datetime.combine(today, datetime.min.time())
    ).all()
    
    if not water_logs:
        return "Don't forget to track your water intake today!"
    
    total_water = sum(log.value for log in water_logs)
    
    if total_water < 1000:
        return f"You've had {int(total_water)}ml of water today. Try to reach 2000ml!"
    elif total_water < 2000:
        return f"Good progress! You've had {int(total_water)}ml of water. Keep going!"
    else:
        return f"Excellent! You've had {int(total_water)}ml of water today. Well hydrated!"
