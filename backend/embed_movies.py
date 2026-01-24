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
SLEEP_SECONDS = 1

# 1. Fetch all movies
movies = supabase.table("movies") \
    .select("id, overview") \
    .execute().data

# 2. Fetch existing embeddings
existing = supabase.table("movie_embeddings") \
    .select("movie_id") \
    .execute().data

existing_ids = {e["movie_id"] for e in existing}

# 3. Filter movies that need embeddings
movies_to_embed = [
    m for m in movies
    if m["id"] not in existing_ids and m["overview"]
]

print(f"Movies needing embeddings: {len(movies_to_embed)}")

# 4. Batch embedding
for i in range(0, len(movies_to_embed), BATCH_SIZE):
    batch = movies_to_embed[i:i+BATCH_SIZE]

    texts = [m["overview"] for m in batch]

    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts
    )

    rows = []
    for movie, emb in zip(batch, response.data):
        rows.append({
            "movie_id": movie["id"],
            "embedding": emb.embedding
        })

    supabase.table("movie_embeddings").insert(rows).execute()

    print(f"Embedded {i + len(batch)} / {len(movies_to_embed)}")

    time.sleep(SLEEP_SECONDS)

print("✅ Embedding complete")
