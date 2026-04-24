from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
import httpx
from urllib.parse import urlencode

from app.schemas.user import UserRegister, UserLogin, UserResponse, Token
from app.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token
)
from app.database import supabase
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# =========================
# REGISTER
# =========================
@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister):
    async with supabase.get_client() as client:

        response = await client.get(
            "/rest/v1/users",
            params={"email": f"eq.{user.email}", "select": "id"}
        )

        print("REGISTER CHECK:", response.status_code, response.json())

        existing = response.json()
        if isinstance(existing, list) and len(existing) > 0:
            raise HTTPException(status_code=400, detail="Email already exists")
        if isinstance(existing, dict) and existing.get("code"):
            raise HTTPException(status_code=400, detail=str(existing))

        hashed = hash_password(user.password)

        new_user = {
            "email": user.email,
            "password": hashed,
            "full_name": user.full_name
        }

        response = await client.post("/rest/v1/users", json=new_user)

        print("REGISTER CREATE:", response.status_code, response.json())

        if response.status_code != 201:
            raise HTTPException(status_code=400, detail=f"Registration failed: {response.json()}")

        created = response.json()
        if isinstance(created, list):
            created = created[0]

        return UserResponse(
            id=created["id"],
            email=created["email"],
            full_name=created["full_name"]
        )


# =========================
# LOGIN
# =========================
@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    async with supabase.get_client() as client:

        response = await client.get(
            "/rest/v1/users",
            params={
                "email": f"eq.{user.email}",
                "select": "id,email,password,full_name"
            }
        )

        print("LOGIN STATUS:", response.status_code)
        print("LOGIN RESPONSE:", response.json())

        users = response.json()

        # Supabase error (dict avec message d'erreur)
        if isinstance(users, dict):
            raise HTTPException(status_code=500, detail=f"Supabase error: {users}")

        # User not found
        if not users or len(users) == 0:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        db_user = users[0]

        # Google user (pas de password)
        if not db_user.get("password"):
            raise HTTPException(status_code=401, detail="Please use Google Sign In")

        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": str(db_user["id"])})

        return Token(access_token=token)


# =========================
# GET CURRENT USER
# =========================
@router.get("/me", response_model=UserResponse)
async def get_me(token: str = Depends(oauth2_scheme)):

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    provider = payload.get("provider")

    async with supabase.get_client() as client:

        # Google user → cherche par email
        if provider == "google":
            response = await client.get(
                "/rest/v1/users",
                params={"email": f"eq.{user_id}", "select": "*"}
            )
        else:
            response = await client.get(
                "/rest/v1/users",
                params={"id": f"eq.{user_id}", "select": "*"}
            )

        print("ME STATUS:", response.status_code)
        print("ME RESPONSE:", response.json())

        users = response.json()

        if isinstance(users, dict):
            raise HTTPException(status_code=500, detail=f"Supabase error: {users}")

        if not users or len(users) == 0:
            raise HTTPException(status_code=404, detail="User not found")

        user = users[0]

        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"]
        )


# =========================
# GOOGLE LOGIN (STEP 1)
# =========================
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/google/login")
async def google_login():

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": f"{settings.BACKEND_URL}/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }

    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)


# =========================
# GOOGLE CALLBACK (STEP 2)
# =========================
@router.get("/google/callback")
async def google_callback(code: str):

    async with httpx.AsyncClient(timeout=30.0) as client:


        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{settings.BACKEND_URL}/auth/google/callback",
                "grant_type": "authorization_code",
            }
        )

        token_data = token_res.json()
        print("GOOGLE TOKEN:", token_data)

        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail=f"Google auth failed: {token_data}")

        user_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"}
        )

        user_info = user_res.json()
        print("GOOGLE USER INFO:", user_info)

    email = user_info.get("email")
    name = user_info.get("name", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email from Google")

    async with supabase.get_client() as client:

        # check if user exists
        response = await client.get(
            "/rest/v1/users",
            params={"email": f"eq.{email}", "select": "*"}
        )

        users = response.json()
        print("GOOGLE SUPABASE CHECK:", users)

        if isinstance(users, list) and len(users) == 0:
            # créer user
            create_res = await client.post("/rest/v1/users", json={
                "email": email,
                "full_name": name,
                "password": None
            })
            print("GOOGLE CREATE USER:", create_res.status_code, create_res.json())

    jwt_token = create_access_token({
        "sub": email,
        "name": name,
        "provider": "google"
    })

    return RedirectResponse(
        f"{settings.FRONTEND_URL}/dashboard?token={jwt_token}"
    )