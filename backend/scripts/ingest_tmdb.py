import os
import requests
from db.supabase_client import supabase
from dotenv import load_dotenv

# Load .env just in case
load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
BASE_URL = "https://api.themoviedb.org/3"

# Step 1: Fetch genre map
def fetch_genre_map():
    res = requests.get(
        f"{BASE_URL}/genre/movie/list",
        params={"api_key": TMDB_API_KEY, "language": "en-US"}
    )
    res.raise_for_status()
    genres = res.json()["genres"]
    return {g["id"]: g["name"] for g in genres}

genre_map = fetch_genre_map()

# Step 2: Fetch popular movies
def fetch_popular_movies(page=1):
    res = requests.get(
        f"{BASE_URL}/movie/popular",
        params={"api_key": TMDB_API_KEY, "language": "en-US", "page": page},
    )
    res.raise_for_status()
    return res.json()["results"]



# Step 3: Ingest movies into Supabase
def ingest_movies(pages=5):
    for page in range(1, pages + 1):
        movies = fetch_popular_movies(page)
        for movie in movies:
            data = {
                "tmdb_id": movie["id"],
                "title": movie.get("title"),
                "overview": movie.get("overview"),
                "poster_path": movie.get("poster_path"),
                "release_date": movie.get("release_date") or None,
                "popularity": movie.get("popularity", 0),
                "genres": [genre_map.get(gid) for gid in movie.get("genre_ids", [])]
            }
            supabase.table("movies").upsert(data, on_conflict="tmdb_id").execute()
        print(f"Page {page} ingested")

if __name__ == "__main__":
    ingest_movies(pages=5)