from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth

# ── App ───────────────────────────────────────────────────────
app = FastAPI(
    title="Industrial AI Platform API",
    description="Backend for Predictive Maintenance + NLP",
    version="1.0.0"
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────
app.include_router(auth.router)

# ── Health check ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "Industrial AI Platform API"}