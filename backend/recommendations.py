from fastapi import APIRouter, HTTPException
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()

import os
import numpy as np
import ast

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_embedding(embedding):
    """
    Supabase returns pgvector as a string like:
    '[0.012, 0.34, ...]'
    Convert it to List[float]
    """
    if isinstance(embedding, list):
        return embedding
    if isinstance(embedding, str):
        return list(map(float, ast.literal_eval(embedding)))
    raise ValueError("Invalid embedding format")

@router.get("/{user_id}")
def get_recommendations(user_id: str):
    try:
        # 1. Fetch user's high ratings
        ratings = (
            supabase.table("ratings")
            .select("movie_id")
            .eq("user_id", user_id)
            .gte("rating", 4)
            .execute()
            .data
        )

        if not ratings:
            return []

        movie_ids = [r["movie_id"] for r in ratings]

        # 2. Fetch embeddings
        embeddings = (
            supabase.table("movie_embeddings")
            .select("embedding")
            .in_("movie_id", movie_ids)
            .execute()
            .data
        )

        if not embeddings:
            return []

        # 3. Average embedding
        vectors = [parse_embedding(e["embedding"]) for e in embeddings]
        user_vector = np.mean(vectors, axis=0).tolist()

        # 4. Vector similarity search
        matches = (
            supabase.rpc(
                "match_movies",
                {
                    "query_embedding": user_vector,
                    "match_count": 20
                }
            )
            .execute()
            .data
        )

        if not matches:
            return []

        movie_ids = [m["movie_id"] for m in matches]

        # 5. Fetch movie metadata
        movies = (
            supabase.table("movies")
            .select("*")
            .in_("id", movie_ids)
            .execute()
            .data
        )

        return movies

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
