# main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Import the router and the database
from database import supabase
try:
    from recommendations import router as recommendations_router
    print("✅ Successfully imported recommendations_router")
except Exception as e:
    print(f"❌ FAILED to import recommendations_router: {e}")
    recommendations_router = None

load_dotenv()

app = FastAPI()

# 2. CORS Setup
origins = [
    "http://localhost:3000",
    "https://flick-finder-green.vercel.app",
    "https://flickfinder.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Health Check
@app.get("/")
def health_check():
    return {"status": "online", "message": "Flick Finder API is running"}

# 4. Include the Router
if recommendations_router:
    app.include_router(recommendations_router, prefix="/recommendations")
    print("✅ Included recommendations_router in FastAPI")
else:
    print("⚠️ Skipping router inclusion because it failed to import")

# 5. DEBUG: Print routes to Railway logs
print("\n--- FINAL REGISTERED ROUTES ---")
for route in app.routes:
    print(f"Path: {route.path}")
print("------------------------------\n")

if __name__ == "__main__":
    import uvicorn
    # Railway uses the PORT environment variable
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)