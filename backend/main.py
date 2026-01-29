from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from recommendations import router as recommendations_router
app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations_router, prefix="/recommendations")
