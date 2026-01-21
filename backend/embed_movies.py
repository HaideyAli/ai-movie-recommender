from supabase import create_client
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)

# Fetch movies without embeddings
movies = supabase.table("movies") \
    .select("id, overview") \
    .execute() \
    .data

for movie in movies:
    if not movie["overview"]:
        continue

    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=movie["overview"]
    ).data[0].embedding

    supabase.table("movie_embeddings").upsert({
        "movie_id": movie["id"],
        "embedding": embedding
    }).execute()

    print(f"Embedded movie {movie['id']}")