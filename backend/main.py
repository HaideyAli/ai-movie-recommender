import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from recommendations import router as recommendations_router
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS setup
origins = [
    "http://localhost:3000",
    "https://flick-finder-green.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # can restrict to origins list if you want
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Supabase client placeholder
supabase = None

# Startup event to initialize Supabase
@app.on_event("startup")
def startup_event():
    global supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Missing Supabase credentials")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized successfully")

# Include router
app.include_router(recommendations_router, prefix="/recommendations")

# Run locally
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
