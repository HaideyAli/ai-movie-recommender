from fastapi import APIRouter, HTTPException, Depends
import numpy as np
import ast
import math

router = APIRouter()

# Dependency to get Supabase client safely
def get_supabase():
    from main import supabase
    if supabase is None:
        raise RuntimeError("Supabase client not initialized")
    return supabase

# --- Helper functions ---
def compute_final_score(similarity, popularity, genre_overlap):
    popularity_score = math.log(1 + popularity) / 10  
    return 0.6 * similarity + 0.25 * popularity_score + 0.15 * genre_overlap

def build_user_vector(embeddings, ratings):
    vectors, weights = [], []

    for emb, rating in zip(embeddings, ratings):
        emb = np.array(emb)
        rating_weight = rating - 2.5
        if rating_weight != 0:
            vectors.append(emb * rating_weight)
            weights.append(abs(rating_weight))

    if not vectors:
        return None

    user_vector = np.sum(vectors, axis=0) / np.sum(weights)
    norm = np.linalg.norm(user_vector)
    if norm > 0:
        user_vector /= norm
    return user_vector.tolist()

def parse_embedding(embedding):
    if isinstance(embedding, list):
        return embedding
    if isinstance(embedding, str):
        return ast.literal_eval(embedding)
    raise ValueError("Unknown embedding format")

def enjoyment_probability(score):
    return int(100 / (1 + math.exp(-4 * (score - 0.5))))

# --- Endpoint ---
@router.get("/{user_id}")
def get_recommendations(user_id: str, supabase=Depends(get_supabase)):
    print("=== HIT RECOMMENDATIONS ENDPOINT ===")
    print("User ID:", user_id)

    try:
        # Fetch ratings
        all_ratings = supabase.table("ratings") \
            .select("movie_id,rating") \
            .eq("user_id", user_id) \
            .execute().data
        print("STEP 2 - Ratings fetched:", len(all_ratings))

        if not all_ratings:
            return []

        all_rated_movie_ids = {r["movie_id"] for r in all_ratings}
        user_genre_weights = {}

        # Fetch genres
        rated_movies = supabase.table("movies") \
            .select("id,genres") \
            .in_("id", all_rated_movie_ids) \
            .execute().data

        movie_genre_map = {m["id"]: m.get("genres", []) for m in rated_movies}
        for r in all_ratings:
            genres = movie_genre_map.get(r["movie_id"], [])
            for g in genres:
                user_genre_weights[g] = user_genre_weights.get(g, 0) + (r["rating"] - 2.5)

        positive_ratings = [r for r in all_ratings if r["rating"] >= 4]
        if not positive_ratings:
            return []

        # Fetch embeddings
        embeddings = supabase.table("movie_embeddings") \
            .select("movie_id,embedding") \
            .in_("movie_id", all_rated_movie_ids) \
            .execute().data
        print("STEP 4 - Embeddings fetched:", len(embeddings))

        if not embeddings:
            return []

        embedding_map = {e["movie_id"]: parse_embedding(e["embedding"]) for e in embeddings}

        movie_embeddings, aligned_ratings = [], []
        for r in all_ratings:
            if r["movie_id"] in embedding_map:
                movie_embeddings.append(embedding_map[r["movie_id"]])
                aligned_ratings.append(r["rating"])

        user_vector = build_user_vector(movie_embeddings, aligned_ratings)
        if not user_vector:
            return []

        # Run RPC
        matches = supabase.rpc("match_movies", {"query_embedding": user_vector, "match_count": 150}).execute().data
        print("STEP 6 - RPC matches:", len(matches) if matches else 0)
        if not matches:
            return []

        matches = [m for m in matches if m["movie_id"] not in all_rated_movie_ids]
        candidate_ids = [m["movie_id"] for m in matches]

        movie_metadata = supabase.table("movies") \
            .select("id,popularity,genres") \
            .in_("id", candidate_ids) \
            .execute().data
        movie_meta_map = {m["id"]: m for m in movie_metadata}

        # Score results
        scored_results = []
        for m in matches:
            movie_id = m["movie_id"]
            similarity = m["similarity"]
            meta = movie_meta_map.get(movie_id)
            if not meta:
                continue
            genre_overlap = sum(user_genre_weights.get(g, 0) for g in meta.get("genres", []))
            genre_overlap = max(0, genre_overlap) / (len(meta.get("genres", [])) + 1)
            score = compute_final_score(similarity, meta.get("popularity", 0), genre_overlap)
            scored_results.append({
                "movie_id": movie_id,
                "score": score,
                "likelihood": enjoyment_probability(score)
            })

        # Sort top 20
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = scored_results[:20]
        top_movie_ids = [r["movie_id"] for r in top_results]

        movies = supabase.table("movies").select("*").in_("id", top_movie_ids).execute().data
        movie_map = {m["id"]: m for m in movies}

        final_results = []
        for r in top_results:
            movie = movie_map.get(r["movie_id"])
            if movie:
                movie["likelihood"] = r["likelihood"]
                final_results.append(movie)

        print("STEP 9 - Returning results:", len(final_results))
        return final_results

    except Exception as e:
        print("ERROR in get_recommendations:", e)
        raise HTTPException(status_code=500, detail=str(e))
