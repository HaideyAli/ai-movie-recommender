from supabase import create_client
from openai import OpenAI
from dotenv import load_dotenv
import os
import time

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
client = OpenAI(api_key=OPENAI_API_KEY)

BATCH_SIZE = 50

# 1. Fetch movies WITHOUT embeddings
movies = supabase.rpc("movies_missing_embeddings").execute().data

print(f"Movies needing embeddings: {len(movies)}")

for i, movie in enumerate(movies):
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

    if i % BATCH_SIZE == 0:
        print(f"Embedded {i}/{len(movies)}")
        time.sleep(1)  # gentle rate-limit protection

print("✅ Embedding complete")
