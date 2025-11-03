from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
import uuid
import logging
from pathlib import Path
from typing import List

from database import get_db, init_db
import models
import schemas
import auth
import rules_engine
import safety_filter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
init_db()
logger.info("Database initialized successfully")

# Create uploads directory
UPLOADS_DIR = Path("/app/backend/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Idunn Wellness API")
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Medical trigger words for safety protocol
# ============ AUTHENTICATION ENDPOINTS ============

@api_router.post("/auth/register", response_model=schemas.TokenResponse)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = auth.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        tier='free'
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create user profile
    profile = models.UserProfile(
        user_id=new_user.id,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    db.add(profile)
    db.commit()
    
    # Create access token
    access_token = auth.create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@api_router.post("/auth/login", response_model=schemas.TokenResponse)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@api_router.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ============ TIER MANAGEMENT ============

@api_router.post("/tier/upgrade")
def upgrade_tier(tier_data: schemas.TierUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if tier_data.new_tier not in ['connect', 'baseline']:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    current_user.tier = tier_data.new_tier
    db.commit()
    
    return {"message": f"Successfully upgraded to {tier_data.new_tier} tier", "tier": current_user.tier}

# ============ HEALTH LOGGING ============

@api_router.post("/v1/log", response_model=schemas.HealthLogResponse)
def log_health_data(
    log_data: schemas.HealthLogCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Validate metric types
    valid_metrics = ['water_ml', 'sleep_hours', 'stress_level', 'steps', 'sleep_deep_seconds', 'heart_rate']
    if log_data.metric_type not in valid_metrics:
        raise HTTPException(status_code=400, detail="Invalid metric type")
    
    new_log = models.HealthLog(
        user_id=current_user.id,
        data_source=log_data.data_source,
        metric_type=log_data.metric_type,
        value=log_data.value
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return new_log

@api_router.get("/v1/logs", response_model=List[schemas.HealthLogResponse])
def get_health_logs(
    metric_type: str = None,
    days: int = 7,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.HealthLog).filter(models.HealthLog.user_id == current_user.id)
    
    if metric_type:
        query = query.filter(models.HealthLog.metric_type == metric_type)
    
    # Filter by date range
    start_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(models.HealthLog.timestamp >= start_date)
    
    logs = query.order_by(models.HealthLog.timestamp.desc()).all()
    return logs

# ============ WEARABLE CONNECTIONS ============

@api_router.post("/v1/wearable/connect", response_model=schemas.WearableResponse)
def connect_wearable(
    wearable_data: schemas.WearableConnect,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check how many wearables user has connected
    connected_count = db.query(models.WearableConnection).filter(
        models.WearableConnection.user_id == current_user.id,
        models.WearableConnection.is_active == 1
    ).count()
    
    # FREEMIUM GATING: Free users can only connect 1 wearable
    if current_user.tier == 'free' and connected_count >= 1:
        raise HTTPException(
            status_code=403,
            detail="Free tier allows only 1 wearable connection. Upgrade to 'Connect' tier for unlimited wearables."
        )
    
    # Check if this wearable is already connected
    existing = db.query(models.WearableConnection).filter(
        models.WearableConnection.user_id == current_user.id,
        models.WearableConnection.wearable_type == wearable_data.wearable_type,
        models.WearableConnection.is_active == 1
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="This wearable is already connected")
    
    # Create connection
    connection = models.WearableConnection(
        user_id=current_user.id,
        wearable_type=wearable_data.wearable_type
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    
    # Stub: In real implementation, this would initiate OAuth flow with the wearable provider
    logger.info(f"User {current_user.email} connected {wearable_data.wearable_type}")
    
    return connection

@api_router.get("/v1/wearable/connections", response_model=List[schemas.WearableResponse])
def get_wearable_connections(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    connections = db.query(models.WearableConnection).filter(
        models.WearableConnection.user_id == current_user.id,
        models.WearableConnection.is_active == 1
    ).all()
    return connections

@api_router.post("/v1/wearable/sync/{wearable_type}")
def sync_wearable_data(
    wearable_type: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if wearable is connected
    connection = db.query(models.WearableConnection).filter(
        models.WearableConnection.user_id == current_user.id,
        models.WearableConnection.wearable_type == wearable_type,
        models.WearableConnection.is_active == 1
    ).first()
    
    if not connection:
        raise HTTPException(status_code=404, detail="Wearable not connected")
    
    # STUB: Simulate syncing data from wearable
    import random
    stub_data = []
    
    if wearable_type == 'apple_health':
        # Simulate syncing steps
        steps_log = models.HealthLog(
            user_id=current_user.id,
            data_source=wearable_type,
            metric_type='steps',
            value=random.randint(3000, 12000)
        )
        db.add(steps_log)
        stub_data.append({'metric': 'steps', 'value': steps_log.value})
        
    elif wearable_type == 'oura':
        # Simulate syncing sleep
        sleep_log = models.HealthLog(
            user_id=current_user.id,
            data_source=wearable_type,
            metric_type='sleep_hours',
            value=round(random.uniform(5.5, 9.0), 1)
        )
        db.add(sleep_log)
        stub_data.append({'metric': 'sleep_hours', 'value': sleep_log.value})
    
    db.commit()
    
    return {"message": f"Synced data from {wearable_type}", "synced_data": stub_data}

# ============ FILE UPLOAD ============

@api_router.post("/v1/upload/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user has access (connect or baseline tier)
    if current_user.tier == 'free':
        raise HTTPException(
            status_code=403,
            detail="PDF upload is only available for 'Connect' and 'Baseline' tiers."
        )
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = UPLOADS_DIR / f"{file_id}_{file.filename}"
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create file scan record
    file_scan = models.FileScan(
        user_id=current_user.id,
        file_type='blood_pdf',
        storage_path=str(file_path)
    )
    db.add(file_scan)
    db.commit()
    
    return {"message": "File uploaded successfully", "file_id": str(file_scan.id), "filename": file.filename}

# ============ AI CHAT ============

@api_router.post("/v1/chat", response_model=List[schemas.ChatResponse])
def chat(
    message_data: schemas.ChatMessage,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Save user message
    user_message = models.ChatHistory(
        user_id=current_user.id,
        sender='user',
        message_text=message_data.message
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # CRITICAL SAFETY PROTOCOL: Use enhanced safety filter
    is_safe, safety_message = safety_filter.check_safety(message_data.message, language='en')
    
    if not is_safe:
        # Return hard stop response
        ai_message = models.ChatHistory(
            user_id=current_user.id,
            sender='ai',
            message_text=safety_message
        )
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        
        logger.warning(f"Safety filter triggered for user {current_user.id}")
        return [user_message, ai_message]
    
    # If no trigger words, generate wellness response (STUB)
    # In production, this would call OpenAI API
    wellness_response = "C'est une excellente question de bien-être! Voici mon conseil: Restez hydraté, dormez 7-9 heures, et bougez votre corps quotidiennement. Je suis là pour soutenir votre parcours de bien-être!"
    
    ai_message = models.ChatHistory(
        user_id=current_user.id,
        sender='ai',
        message_text=wellness_response
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return [user_message, ai_message]

@api_router.get("/v1/chat/history", response_model=List[schemas.ChatResponse])
def get_chat_history(
    limit: int = 50,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    history = db.query(models.ChatHistory).filter(
        models.ChatHistory.user_id == current_user.id
    ).order_by(models.ChatHistory.timestamp.desc()).limit(limit).all()
    
    return list(reversed(history))

# ============ DASHBOARD ============

@api_router.get("/v1/dashboard", response_model=schemas.DashboardData)
def get_dashboard(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Get recent logs (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_logs = db.query(models.HealthLog).filter(
        models.HealthLog.user_id == current_user.id,
        models.HealthLog.timestamp >= seven_days_ago
    ).order_by(models.HealthLog.timestamp.desc()).limit(20).all()
    
    # Get connected wearables
    wearables = db.query(models.WearableConnection).filter(
        models.WearableConnection.user_id == current_user.id,
        models.WearableConnection.is_active == 1
    ).all()
    
    # Get insights from rules engine
    sleep_insight = rules_engine.get_wellness_insight(str(current_user.id), db)
    hydration_insight = rules_engine.get_hydration_insight(str(current_user.id), db)
    
    return {
        "user": current_user,
        "recent_logs": recent_logs,
        "connected_wearables": wearables,
        "insights": {
            "sleep": sleep_insight,
            "hydration": hydration_insight
        }
    }

# ============ INSIGHTS (WELLNESS BRAIN) ============

@api_router.get("/v1/insights")
def get_insights(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized wellness insights from the Wellness Brain (Cerveau n°1).
    Returns a list of insights with optional product recommendations.
    """
    engine = rules_engine.WellnessEngine(db)
    insights = engine.generate_insights(str(current_user.id))
    
    return {"insights": insights, "count": len(insights)}

# ============ MARKETPLACE ============

@api_router.get("/v1/products", response_model=List[schemas.ProductResponse])
def get_all_products(db: Session = Depends(get_db)):
    """Get all products from the marketplace"""
    products = db.query(models.Product).order_by(models.Product.created_at.desc()).all()
    return products

@api_router.get("/v1/products/category/{category_name}", response_model=List[schemas.ProductResponse])
def get_products_by_category(category_name: str, db: Session = Depends(get_db)):
    """Get products filtered by category"""
    products = db.query(models.Product).filter(
        models.Product.category == category_name.lower()
    ).order_by(models.Product.created_at.desc()).all()
    return products

@api_router.get("/v1/product/{product_id}", response_model=schemas.ProductResponse)
def get_product_by_id(product_id: str, db: Session = Depends(get_db)):
    """Get a single product by ID"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Legacy endpoint for backwards compatibility
@api_router.get("/v1/marketplace", response_model=List[schemas.ProductResponse])
def get_marketplace_products(db: Session = Depends(get_db)):
    """Legacy marketplace endpoint - redirects to /v1/products"""
    return get_all_products(db)

# Health check
@api_router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Idunn Wellness API"}

# Include router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
