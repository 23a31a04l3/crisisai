from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from services.gemini_service import analyze_news, get_safety_tips
from services.firebase_service import init_firebase, log_query

app = FastAPI(title="CrisisAI API")

# Setup CORS for frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase on startup
@app.on_event("startup")
def startup_event():
    init_firebase()

class NewsQuery(BaseModel):
    text: str

class SafetyQuery(BaseModel):
    disaster_type: str

@app.get("/")
def read_root():
    return {"message": "CrisisAI Backend is running."}

@app.post("/api/check-news")
def check_news(query: NewsQuery):
    if not query.text:
        raise HTTPException(status_code=400, detail="Text is required")
        
    result = analyze_news(query.text)
    
    # Log the query to Firebase
    log_query("news_checks", {
        "text": query.text,
        "result": result,
        "timestamp": datetime.utcnow()
    })
    
    return result

@app.post("/api/safety-tips")
def safety_tips(query: SafetyQuery):
    if not query.disaster_type:
        raise HTTPException(status_code=400, detail="Disaster type is required")
        
    result = get_safety_tips(query.disaster_type)
    
    # Log the query to Firebase
    log_query("safety_queries", {
        "disaster_type": query.disaster_type,
        "timestamp": datetime.utcnow()
    })
    
    return result

# Note: The /nearby-resources endpoint is handled on the frontend via Google Maps API directly
# to save latency and avoid routing map requests through the backend unnecessarily.
