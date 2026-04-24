from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token
from app.services.auth import hash_password, verify_password, create_access_token, decode_token
from app.database import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ── Register ──────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister):
    async with supabase.get_client() as client:
        # Vérifier si email existe déjà
        response = await client.get(
            "/rest/v1/users",
            params={"email": f"eq.{user.email}", "select": "id"}
        )
        if response.json():
            raise HTTPException(status_code=400, detail="Email already exists")

        # Créer le user
        hashed = hash_password(user.password)
        new_user = {
            "email": user.email,
            "password": hashed,
            "full_name": user.full_name
        }
        response = await client.post("/rest/v1/users", json=new_user)
        if response.status_code != 201:
            raise HTTPException(status_code=400, detail="Registration failed")

        created = response.json()[0]
        return UserResponse(
            id=created["id"],
            email=created["email"],
            full_name=created["full_name"]
        )

# ── Login ─────────────────────────────────────────────────────
@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    async with supabase.get_client() as client:
        response = await client.get(
            "/rest/v1/users",
            params={"email": f"eq.{user.email}", "select": "id,email,password,full_name"}
        )
        
        # Debug : voir ce que Supabase retourne
        print("Status:", response.status_code)
        print("Response:", response.json())
        
        users = response.json()
        
        if not users or len(users) == 0:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        db_user = users[0]
        print("db_user keys:", db_user.keys())

        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": db_user["id"]})
        return Token(access_token=token)
# ── Get current user ──────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    async with supabase.get_client() as client:
        response = await client.get(
            "/rest/v1/users",
            params={"id": f"eq.{payload['sub']}", "select": "*"}
        )
        users = response.json()
        if not users:
            raise HTTPException(status_code=404, detail="User not found")

        user = users[0]
        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"]
        )