# main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 1. Be explicit with Origins. 
# Remove the wildcard "*" and use your actual Vercel URL.
origins = [
    "http://localhost:3000",
    "https://flick-finder-green.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# DEBUG: Add this root endpoint to test if the API is alive
@app.get("/")
def health_check():
    return {"status": "online", "message": "Flick Finder API is running"}