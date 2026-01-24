from fastapi import APIRouter, HTTPException
from supabase import create_client
from dotenv import load_dotenv
import os
import numpy as np
import ast
import math

load_dotenv()

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def compute_final_score(similarity, popularity, genre_overlap):
    # Normalize popularity (log-scaled)
    popularity_score = math.log(1 + popularity) / 10  

    final_score = (
        0.60 * similarity +
        0.25 * popularity_score +
        0.15 * genre_overlap
    )

    return final_score

def build_user_vector(embeddings, ratings):
    vectors = []
    weights = []

    for emb, rating in zip(embeddings, ratings):
        emb = np.array(emb)

        rating_weight = rating - 2.5  # center around neutral

        if rating_weight > 0:
            vectors.append(emb * rating_weight)
            weights.append(abs(rating_weight))
        elif rating_weight < 0:
            vectors.append(emb * rating_weight)
            weights.append(abs(rating_weight))

        #elif rating <= 2:
            # Negative signal (dislike penalty)
            #vectors.append(emb * -1.5)
            #weights.append(1.5)

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

def enjoyment_probability(score):
    return int(100 / (1 + math.exp(-4 * (score - 0.5))))

@router.get("/{user_id}")
def get_recommendations(user_id: str):
    try:
        #Fetch ratings
        all_ratings = supabase.table("ratings") \
            .select("movie_id, rating") \
            .eq("user_id", user_id) \
            .execute().data

        if not all_ratings:
            return []
        
        all_rated_movie_ids = {r["movie_id"] for r in all_ratings}

        user_genre_weights = {}

        rated_movies = supabase.table("movies") \
            .select("id, genres") \
            .in_("id", all_rated_movie_ids) \
            .execute().data

        movie_genre_map = {
            m["id"]: m.get("genres", []) for m in rated_movies
        }

        for r in all_ratings:
            genres = movie_genre_map.get(r["movie_id"], [])
            for g in genres:
                user_genre_weights[g] = user_genre_weights.get(g, 0) + (r["rating"] - 2.5)


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

        candidate_ids = [m["movie_id"] for m in matches]

        movie_metadata = supabase.table("movies") \
            .select("id, popularity, genres") \
            .in_("id", candidate_ids) \
            .execute().data

        movie_meta_map = {
            m["id"]: m for m in movie_metadata
        }

        scored_results = []

        for m in matches:
            movie_id = m["movie_id"]
            similarity = m["similarity"]

            meta = movie_meta_map.get(movie_id)
            if not meta:
                continue

            popularity = meta.get("popularity", 0)
            genres = meta.get("genres", [])

            # Genre overlap score
            genre_overlap = sum(
                user_genre_weights.get(g, 0) for g in genres
            )
            genre_overlap = max(0, genre_overlap) / (len(genres) + 1)

            score = compute_final_score(
                similarity,
                popularity,
                genre_overlap
            )

            scored_results.append({
                "movie_id": movie_id,
                "score": score,
                "likelihood": enjoyment_probability(score)
            })

        # Sort by final score (THIS IS THE KEY PART)
        scored_results.sort(key=lambda x: x["score"], reverse=True)

        top_results = scored_results[:20]
        top_movie_ids = [r["movie_id"] for r in top_results]

        movies = supabase.table("movies") \
            .select("*") \
            .in_("id", top_movie_ids) \
            .execute().data

        movie_map = {m["id"]: m for m in movies}

        final_results = []
        for r in top_results:
            movie = movie_map.get(r["movie_id"])
            if movie:
                movie["likelihood"] = r["likelihood"]
                final_results.append(movie)

        for r in final_results[:50]:
            print(r["title"], r["likelihood"])

        return final_results


    except Exception as e:
        print("ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
