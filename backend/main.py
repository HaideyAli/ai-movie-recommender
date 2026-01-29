import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# 1. Ensure you import your router
from recommendations import router as recommendations_router 

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://flick-finder-green.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Include the router (Double check if you want the prefix or not)
app.include_router(recommendations_router, prefix="/recommendations")

@app.get("/")
def health_check():
    return {"status": "online", "message": "Flick Finder API is running"}

# 3. DEBUG BLOCK: This prints every registered URL to your Railway logs
print("\n--- REGISTERED ROUTES ---")
for route in app.routes:
    # Look for 'path' and 'name' in your logs
    print(f"Route: {route.path} | Methods: {list(route.methods)}")
print("------------------------\n")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port)