from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from recommendations import router as recommendations_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations_router, prefix="/recommendations")

# ---- RUN FASTAPI ----
if __name__ == "__main__":
    import uvicorn

    # Railway provides PORT in env variables
    port = int(os.environ.get("PORT", 8000))

    # host=0.0.0.0 is necessary for cloud deployment
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)