from fastapi import APIRouter
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()  # IMPORTANT

router = APIRouter(prefix="/recommendations")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
@router.get("/{user_id}")
def get_recommendations(user_id: str):
    print(user_id)

    # 1. Fetch user ratings
    ratings_res = supabase.table("ratings") \
        .select("movie_id, rating") \
        .filter("user_id", "eq", user_id) \
        .execute()
    
    print(ratings_res.data)

    if not ratings_res.data:
        return []

    rated_movie_ids = {r["movie_id"] for r in ratings_res.data}

    # 2. Fetch movies user rated highly (>= 4)
    liked_ids = [
        r["movie_id"]
        for r in ratings_res.data
        if r["rating"] >= 4
    ]

    if not liked_ids:
        return []

    liked_movies = supabase.table("movies") \
        .select("genres") \
        .in_("id", liked_ids) \
        .execute() \
        .data

    # 3. Build preferred genre set
    preferred_genres = set()
    for movie in liked_movies:
        if movie["genres"]:
            for g in movie["genres"]:
                preferred_genres.add(g.strip().lower())

    # 4. Fetch candidate movies (unrated)
    movies = supabase.table("movies") \
        .select("id, title, poster_path, genres, popularity") \
        .execute() \
        .data

    scored = []

    for movie in movies:
        if movie["id"] in rated_movie_ids:
            continue

        score = 0

        if movie["genres"]:
            movie_genres = {
                g.strip().lower()
                for g in movie["genres"]
            }
            score += len(movie_genres & preferred_genres) * 2

        score += movie.get("popularity", 0) * 0.01

        if score > 0:
            scored.append((score, movie))

    # 5. Sort & return top results
    scored.sort(reverse=True, key=lambda x: x[0])

    return [
    {
        "score": score,
        "movie": movie
    }
    for score, movie in scored[:20]
    ]
