from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    points: int = 0
    level: int = 1
    badges: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    points: int
    level: int
    badges: List[str]

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GameProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_type: str  # "quiz", "waste_sorting", "energy_saving"
    level: int
    score: int
    completed: bool = False
    completed_at: Optional[str] = None

class GameProgressCreate(BaseModel):
    game_type: str
    level: int
    score: int
    completed: bool = False

class QuizQuestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    category: str
    difficulty: int

class QuizAnswer(BaseModel):
    question_id: str
    selected_answer: int

class Challenge(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    points_required: int
    points_reward: int
    badge: Optional[str] = None
    category: str

class ProofSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    challenge_id: str
    image_data: str
    status: str = "pending"  # pending, approved, rejected
    submitted_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProofSubmissionCreate(BaseModel):
    challenge_id: str
    image_data: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    type: str  # achievement, challenge_unlock, reminder
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LeaderboardEntry(BaseModel):
    username: str
    points: int
    level: int
    rank: int

# Authentication routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.model_dump())
    
    # Create token
    token = create_access_token({"user_id": user.id})
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        points=user.points,
        level=user.level,
        badges=user.badges
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = User(**user_doc)
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user.id})
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        points=user.points,
        level=user.level,
        badges=user.badges
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        points=current_user.points,
        level=current_user.level,
        badges=current_user.badges
    )

# Game Progress routes
@api_router.post("/game-progress")
async def save_game_progress(
    progress_data: GameProgressCreate,
    current_user: User = Depends(get_current_user)
):
    progress = GameProgress(
        user_id=current_user.id,
        **progress_data.model_dump()
    )
    
    if progress.completed:
        progress.completed_at = datetime.now(timezone.utc).isoformat()
    
    await db.game_progress.insert_one(progress.model_dump())
    
    # Award points and update user
    points_earned = progress.score
    new_points = current_user.points + points_earned
    new_level = (new_points // 100) + 1  # Level up every 100 points
    
    # Check for new badges
    new_badges = current_user.badges.copy()
    if progress.game_type == "quiz" and progress.score >= 80 and "Quiz Master" not in new_badges:
        new_badges.append("Quiz Master")
    elif progress.game_type == "waste_sorting" and progress.level == 5 and "Sorting Champion" not in new_badges:
        new_badges.append("Sorting Champion")
    elif progress.game_type == "energy_saving" and progress.level == 5 and "Energy Hero" not in new_badges:
        new_badges.append("Energy Hero")
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"points": new_points, "level": new_level, "badges": new_badges}}
    )
    
    # Create notification for new badge
    if len(new_badges) > len(current_user.badges):
        notification = Notification(
            user_id=current_user.id,
            message=f"Congratulations! You earned a new badge: {new_badges[-1]}",
            type="achievement"
        )
        await db.notifications.insert_one(notification.model_dump())
    
    return {"message": "Progress saved", "points_earned": points_earned, "new_level": new_level, "new_badges": new_badges}

@api_router.get("/game-progress")
async def get_game_progress(current_user: User = Depends(get_current_user)):
    progress_list = await db.game_progress.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    return progress_list

# Quiz routes
@api_router.get("/quiz/questions")
async def get_quiz_questions(category: Optional[str] = None, limit: int = 10):
    query = {"category": category} if category else {}
    questions = await db.quiz_questions.find(query, {"_id": 0}).to_list(limit)
    
    # If no questions in DB, return sample questions
    if not questions:
        sample_questions = [
            {
                "id": str(uuid.uuid4()),
                "question": "What percentage of plastic ever produced has been recycled?",
                "options": ["Less than 10%", "About 25%", "About 50%", "More than 75%"],
                "correct_answer": 0,
                "category": "recycling",
                "difficulty": 1
            },
            {
                "id": str(uuid.uuid4()),
                "question": "Which of these uses the LEAST amount of water?",
                "options": ["Taking a bath", "Taking a 5-minute shower", "Washing dishes by hand", "Running a dishwasher"],
                "correct_answer": 3,
                "category": "water_conservation",
                "difficulty": 1
            },
            {
                "id": str(uuid.uuid4()),
                "question": "What is the main greenhouse gas contributing to climate change?",
                "options": ["Oxygen", "Nitrogen", "Carbon Dioxide", "Helium"],
                "correct_answer": 2,
                "category": "climate",
                "difficulty": 1
            },
            {
                "id": str(uuid.uuid4()),
                "question": "How long does it take for a plastic bottle to decompose?",
                "options": ["10 years", "50 years", "100 years", "450 years"],
                "correct_answer": 3,
                "category": "pollution",
                "difficulty": 2
            },
            {
                "id": str(uuid.uuid4()),
                "question": "Which renewable energy source is most widely used globally?",
                "options": ["Solar", "Wind", "Hydroelectric", "Geothermal"],
                "correct_answer": 2,
                "category": "energy",
                "difficulty": 2
            }
        ]
        # Insert sample questions
        await db.quiz_questions.insert_many(sample_questions)
        return sample_questions
    
    return questions

@api_router.post("/quiz/submit")
async def submit_quiz_answers(
    answers: List[QuizAnswer],
    current_user: User = Depends(get_current_user)
):
    correct_count = 0
    total_questions = len(answers)
    
    for answer in answers:
        question = await db.quiz_questions.find_one({"id": answer.question_id}, {"_id": 0})
        if question and question["correct_answer"] == answer.selected_answer:
            correct_count += 1
    
    score = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    return {
        "score": score,
        "correct": correct_count,
        "total": total_questions
    }

# Challenge routes
@api_router.get("/challenges")
async def get_challenges(current_user: User = Depends(get_current_user)):
    all_challenges = await db.challenges.find({}, {"_id": 0}).to_list(1000)
    
    # If no challenges in DB, create sample challenges
    if not all_challenges:
        sample_challenges = [
            {
                "id": str(uuid.uuid4()),
                "title": "Plastic-Free Day",
                "description": "Go one full day without using any single-use plastic. Take a photo of your reusable items!",
                "points_required": 0,
                "points_reward": 50,
                "badge": "Plastic Warrior",
                "category": "waste_reduction"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Plant a Tree",
                "description": "Plant a tree or start a small garden. Upload a photo of your plant!",
                "points_required": 50,
                "points_reward": 100,
                "badge": "Green Thumb",
                "category": "nature"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Energy Audit",
                "description": "Conduct a home energy audit. Identify 5 ways to save energy and take before/after photos.",
                "points_required": 100,
                "points_reward": 75,
                "badge": "Energy Detective",
                "category": "energy"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Public Transport Week",
                "description": "Use only public transportation, cycling, or walking for one week. Document your journey!",
                "points_required": 150,
                "points_reward": 150,
                "badge": "Eco Commuter",
                "category": "transportation"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Zero Waste Meal",
                "description": "Prepare a meal producing zero waste. Show us your creative packaging solutions!",
                "points_required": 200,
                "points_reward": 100,
                "badge": "Waste Warrior",
                "category": "waste_reduction"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Beach/Park Cleanup",
                "description": "Organize or participate in a local cleanup. Upload photos of the cleanup in action!",
                "points_required": 300,
                "points_reward": 200,
                "badge": "Cleanup Champion",
                "category": "community"
            }
        ]
        await db.challenges.insert_many(sample_challenges)
        all_challenges = sample_challenges
    
    # Mark challenges as unlocked based on user points
    for challenge in all_challenges:
        challenge["unlocked"] = current_user.points >= challenge["points_required"]
        # Check if user has submitted proof for this challenge
        submission = await db.proof_submissions.find_one({
            "user_id": current_user.id,
            "challenge_id": challenge["id"]
        }, {"_id": 0})
        challenge["submitted"] = submission is not None
        challenge["status"] = submission["status"] if submission else None
    
    return all_challenges

@api_router.post("/challenges/submit-proof")
async def submit_proof(
    proof_data: ProofSubmissionCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if challenge exists and is unlocked
    challenge = await db.challenges.find_one({"id": proof_data.challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if current_user.points < challenge["points_required"]:
        raise HTTPException(status_code=403, detail="Challenge is locked. Earn more points to unlock!")
    
    # Check if already submitted
    existing = await db.proof_submissions.find_one({
        "user_id": current_user.id,
        "challenge_id": proof_data.challenge_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted proof for this challenge")
    
    proof = ProofSubmission(
        user_id=current_user.id,
        **proof_data.model_dump()
    )
    
    await db.proof_submissions.insert_one(proof.model_dump())
    
    # Auto-approve and award points (in production, this would be manual review)
    await db.proof_submissions.update_one(
        {"id": proof.id},
        {"$set": {"status": "approved"}}
    )
    
    # Award points and badge
    new_points = current_user.points + challenge["points_reward"]
    new_level = (new_points // 100) + 1
    new_badges = current_user.badges.copy()
    
    if challenge.get("badge") and challenge["badge"] not in new_badges:
        new_badges.append(challenge["badge"])
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"points": new_points, "level": new_level, "badges": new_badges}}
    )
    
    # Create notification
    notification = Notification(
        user_id=current_user.id,
        message=f"Challenge completed! You earned {challenge['points_reward']} points!",
        type="achievement"
    )
    await db.notifications.insert_one(notification.model_dump())
    
    return {
        "message": "Proof submitted and approved!",
        "points_earned": challenge["points_reward"],
        "new_level": new_level,
        "badge_earned": challenge.get("badge")
    }

# Leaderboard route
@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10):
    users = await db.users.find({}, {"_id": 0, "username": 1, "points": 1, "level": 1}).sort("points", -1).to_list(limit)
    
    leaderboard = []
    for idx, user in enumerate(users):
        leaderboard.append(LeaderboardEntry(
            username=user["username"],
            points=user["points"],
            level=user["level"],
            rank=idx + 1
        ))
    
    return leaderboard

# Notification routes
@api_router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
