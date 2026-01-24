from fastapi import APIRouter, HTTPException
from supabase import create_client
from dotenv import load_dotenv
import os
import numpy as np
import ast

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def build_user_vector(embeddings, ratings):
    vectors = []
    weights = []

    for emb, rating in zip(embeddings, ratings):
        emb = np.array(emb)

        if rating >= 4:
            vectors.append(emb * rating)
            weights.append(rating)

        elif rating <= 2:
            # Negative signal (dislike penalty)
            vectors.append(emb * -1.5)
            weights.append(1.5)

    if not vectors:
        return None

    user_vector = np.sum(vectors, axis=0) / np.sum(weights)

    # Normalize
    norm = np.linalg.norm(user_vector)
    if norm > 0:
        user_vector /= norm

    return user_vector.tolist()



def parse_embedding(embedding):
    """
    Handles vector coming back as string from Supabase
    """
    if isinstance(embedding, list):
        return embedding
    if isinstance(embedding, str):
        return ast.literal_eval(embedding)
    raise ValueError("Unknown embedding format")


@router.get("/{user_id}")
def get_recommendations(user_id: str):
    try:
        all_ratings = supabase.table("ratings") \
            .select("movie_id, rating") \
            .eq("user_id", user_id) \
            .execute().data

        if not all_ratings:
            return []

        all_rated_movie_ids = {r["movie_id"] for r in all_ratings}

        positive_ratings = [
            r for r in all_ratings if r["rating"] >= 4
        ]

        if not positive_ratings:
            return []

        # 2. Fetch embeddings for rated movies
        embeddings = supabase.table("movie_embeddings") \
            .select("movie_id, embedding") \
            .in_("movie_id", all_rated_movie_ids) \
            .execute().data

        if not embeddings:
            return []
        
        # Map movie_id -> embedding
        embedding_map = {
            e["movie_id"]: parse_embedding(e["embedding"])
            for e in embeddings
        }

        movie_embeddings = []
        aligned_ratings = []

        for r in all_ratings:
            movie_id = r["movie_id"]
            if movie_id in embedding_map:
                movie_embeddings.append(embedding_map[movie_id])
                aligned_ratings.append(r["rating"])


        # 3. Average embedding (user taste vector)
        user_vector = build_user_vector(
            movie_embeddings,
            aligned_ratings
        )

        if not user_vector:
            return []


        # 4. Vector similarity search
        matches = supabase.rpc(
            "match_movies",
            {
                "query_embedding": user_vector,
                "match_count": 150
            }
        ).execute().data

        if not matches:
            return []
        
        matches = [
            m for m in matches
            if m["movie_id"] not in all_rated_movie_ids
        ]
        
        for m in matches[:10]:
            print("Recommended:", m["movie_id"], "score:", m.get("similarity"))

        recommended_movie_ids = [
            m["movie_id"] for m in matches
            if m["movie_id"] not in all_rated_movie_ids 
        ]

        if not recommended_movie_ids:
            return []

        # 5. Fetch movie metadata
        movies = supabase.table("movies") \
            .select("*") \
            .in_("id", recommended_movie_ids) \
            .execute().data
        
        print("Positive ratings:", [r["rating"] for r in positive_ratings])
        print("All ratings:", [r["rating"] for r in all_ratings])
        print("Top 5 matches:", matches[:5])

        return movies

    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
