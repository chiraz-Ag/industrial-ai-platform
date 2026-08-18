# ═════════════════════════════════════════════════════════════════════
# FASTAPI BACKEND — RUL + RAG + MISTRAL (VERSION CORRIGÉE)
# ═════════════════════════════════════════════════════════════════════

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib, io, os, pickle, json, time
from tensorflow import keras
from dotenv import load_dotenv
from functools import lru_cache
import requests
import hashlib

load_dotenv()

response_cache = {}
last_mistral_call = 0
MISTRAL_DELAY = 1  # minimum 1 second between calls

print("Initializing Mistral API Client...")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    print("⚠️ MISTRAL_API_KEY not found in .env")
else:
    print("✅ Mistral API key loaded")

app = FastAPI(title="AxialAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── RUL Config ────────────────────────────────────────────────
COLUMNS = [
    'unit_id', 'time_cycle',
    'op_setting_1', 'op_setting_2', 'op_setting_3',
    *[f'sensor_{i:02d}' for i in range(1, 22)]
]
SENSORS_TO_KEEP = [
    'sensor_02','sensor_03','sensor_04','sensor_07',
    'sensor_08','sensor_09','sensor_11','sensor_12',
    'sensor_13','sensor_14','sensor_15','sensor_17',
    'sensor_20','sensor_21'
]
SETTING_COLS = ['op_setting_1', 'op_setting_2', 'op_setting_3']
FEATURE_COLS = SENSORS_TO_KEEP + SETTING_COLS
WINDOW_SIZE  = 30
RUL_CAP      = 125

# ── Load RUL model ────────────────────────────────────────────
print("Loading RUL model...")
model = keras.models.load_model("cnn_lstm_combined_best.keras")
scalers = {
    'FD001': joblib.load('scalers_fd001.pkl'),
    'FD002': joblib.load('scalers_fd002.pkl'),
    'FD003': joblib.load('scalers_fd003.pkl'),
    'FD004': joblib.load('scalers_fd004.pkl'),
}
kmeans = {
    'FD002': joblib.load('kmeans_fd002.pkl'),
    'FD004': joblib.load('kmeans_fd004.pkl'),
}
print("✅ RUL model loaded")

# ── Load RAG assets ───────────────────────────────────────────
print("Loading RAG assets...")
import faiss
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

FAISS_INDEX = faiss.read_index("faiss.index")

with open("bm25.pkl", "rb") as f:
    BM25_INDEX = pickle.load(f)

with open("rag_chunks.pkl", "rb") as f:
    rag_chunks = pickle.load(f)

with open("config.json", "r") as f:
    rag_config = json.load(f)

EMBED_MODEL = SentenceTransformer(rag_config["embed_model"])
TOP_K_RETRIEVE = rag_config["top_k_retrieve"]
TOP_K_RERANK   = rag_config["top_k_rerank"]

print(f"✅ RAG loaded — {len(rag_chunks)} chunks")

# ── RAG Functions ─────────────────────────────────────────────
def embed(texts):
    return EMBED_MODEL.encode(texts, normalize_embeddings=True)

def hybrid_retrieve(query, top_k=10):
    q_emb = embed([query]).astype("float32")
    D, I  = FAISS_INDEX.search(q_emb, top_k * 2)
    dense = {I[0][i]: float(D[0][i]) for i in range(len(I[0])) if I[0][i] >= 0}

    tokens      = query.lower().split()
    bm25_scores = BM25_INDEX.get_scores(tokens)
    bm25_top    = np.argsort(bm25_scores)[::-1][:top_k * 2]
    bm25_max    = max(bm25_scores) if max(bm25_scores) > 0 else 1
    bm25        = {i: float(bm25_scores[i] / bm25_max) for i in bm25_top}

    all_ids = set(dense) | set(bm25)
    fused   = {idx: dense.get(idx, 0) * 0.65 + bm25.get(idx, 0) * 0.35 for idx in all_ids}
    top     = sorted(fused, key=fused.get, reverse=True)[:top_k]
    return [(rag_chunks[i], fused[i]) for i in top if i < len(rag_chunks)]

def call_mistral(prompt: str, max_tokens: int = 512, temperature: float = 0.2) -> str:
    global last_mistral_call

    if not MISTRAL_API_KEY:
        return "Mistral API key not configured."

    # Check cache first
    cache_key = hashlib.md5(prompt.encode()).hexdigest()
    if cache_key in response_cache:
        print(f"✅ Cache hit for query")
        return response_cache[cache_key]

    # Throttle: wait if last call was too recent
    time_since_last = time.time() - last_mistral_call
    if time_since_last < MISTRAL_DELAY:
        wait_time = MISTRAL_DELAY - time_since_last
        print(f"⏳ Throttling: waiting {wait_time:.2f}s")
        time.sleep(wait_time)

    max_retries = 2
    for attempt in range(max_retries):
        try:
            last_mistral_call = time.time()
            response = requests.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {MISTRAL_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "mistral-small",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature
                },
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"]
                response_cache[cache_key] = result
                return result
            elif response.status_code == 429:
                wait_time = 3 * (2 ** attempt)
                print(f"⚠️ Rate limited. Waiting {wait_time}s before retry")
                if attempt < max_retries - 1:
                    time.sleep(wait_time)
                    continue
                return "⏳ Service temporarily overloaded. Try again in 30 seconds."
            else:
                return f"Mistral API error: {response.status_code}"

        except requests.exceptions.Timeout:
            return "Request timeout. Service is slow."
        except Exception as e:
            print(f"⚠️ Mistral error (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
            else:
                return f"Error: {str(e)}"

    return "Max retries exceeded"

# ── RUL Functions ─────────────────────────────────────────────
def detect_dataset(df):
    op_var = df[SETTING_COLS].var().sum()
    return 'FD001' if op_var < 0.01 else 'FD002'

def preprocess(df, dataset):
    df = df.copy()
    sc = scalers[dataset]
    if dataset in ['FD001', 'FD003']:
        df[SENSORS_TO_KEEP] = sc[0].transform(df[SENSORS_TO_KEEP])
    else:
        km = kmeans[dataset]
        df['condition'] = km.predict(df[SETTING_COLS])
        for cond in df['condition'].unique():
            mask = df['condition'] == cond
            if cond in sc:
                df.loc[mask, SENSORS_TO_KEEP] = sc[cond].transform(df.loc[mask, SENSORS_TO_KEEP])
        df = df.drop(columns=['condition'])
    for col in SETTING_COLS:
        mn, mx = df[col].min(), df[col].max()
        df[col] = (df[col] - mn) / (mx - mn) if mx - mn > 0 else 0.0
    return df

def make_windows(df):
    results = []
    for uid, group in df.groupby('unit_id'):
        group = group.sort_values('time_cycle')
        data  = group[FEATURE_COLS].values
        T     = len(data)
        window = data[-WINDOW_SIZE:] if T >= WINDOW_SIZE else np.vstack([np.repeat(data[[0]], WINDOW_SIZE - T, axis=0), data])
        results.append({'unit_id': int(uid), 'window': window, 'n_cycles': T})
    return results

def get_sensor_history(df_raw, unit_id):
    group = df_raw[df_raw['unit_id'] == unit_id].sort_values('time_cycle')
    key_sensors = ['sensor_02','sensor_03','sensor_04','sensor_07','sensor_11','sensor_12']
    history = {'time_cycle': group['time_cycle'].tolist()}
    for s in key_sensors:
        if s in group.columns:
            history[s] = group[s].tolist()
    return history

# ── Request Models ────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str
    history: list = []

class SummarizeRequest(BaseModel):
    text: str
    title: str = "document"

# ── Endpoints ─────────────────────────────────────────────────
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        content      = await file.read()
        df_raw       = pd.read_csv(io.StringIO(content.decode()), sep=r'\s+', header=None, names=COLUMNS)
        dataset      = detect_dataset(df_raw)
        df_processed = preprocess(df_raw, dataset)
        units        = make_windows(df_processed)
        X            = np.array([u['window'] for u in units])
        preds        = np.clip(model.predict(X, verbose=0).flatten(), 0, RUL_CAP)

        results = []
        for i, unit in enumerate(units):
            rul    = float(round(preds[i]))
            status = 'healthy' if rul > 50 else 'warning' if rul > 20 else 'critical'
            results.append({
                'unit_id': unit['unit_id'], 'rul': rul, 'status': status,
                'n_cycles': unit['n_cycles'],
                'sensor_history': get_sensor_history(df_raw, unit['unit_id'])
            })
        results.sort(key=lambda x: x['rul'])
        return {
            'dataset': dataset, 'total': len(results),
            'critical': sum(1 for r in results if r['status'] == 'critical'),
            'warning':  sum(1 for r in results if r['status'] == 'warning'),
            'healthy':  sum(1 for r in results if r['status'] == 'healthy'),
            'engines':  results
        }
    except Exception as e:
        return {'error': str(e)}


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        candidates = hybrid_retrieve(req.query, top_k=TOP_K_RETRIEVE)
        context    = "\n\n".join([c["text"] for c, _ in candidates[:TOP_K_RERANK]])

        hist_str = ""
        for turn in req.history[-4:]:
            hist_str += f"User: {turn['user']}\nAssistant: {turn['assistant']}\n"

        prompt = f"""You are an expert turbofan engine maintenance assistant.
Use the following technical context to answer the question accurately and concisely.

Context:
{context}

{hist_str}
Question: {req.query}

Answer:"""

        answer  = call_mistral(prompt)
        sources = [
            {"text": c["text"][:200], "source": c.get("source", ""), "score": round(s, 3)}
            for c, s in candidates[:3]
        ]
        return {"answer": answer, "sources": sources}

    except Exception as e:
        return {"error": str(e)}


@app.post("/summarize")
async def summarize(req: SummarizeRequest):
    try:
        words = req.text.split()
        if len(words) > 4000:
            chunk_size = 800
            chunks     = [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]
            summaries  = []
            for chunk in chunks:
                prompt = f"Summarize this technical text about turbofan engines concisely:\n\n{chunk}"
                summaries.append(call_mistral(prompt))
            combined     = " ".join(summaries)
            final_prompt = f"Create a final comprehensive summary from these partial summaries:\n\n{combined}"
            final        = call_mistral(final_prompt)
        else:
            prompt = f"You are a technical expert. Summarize this document about {req.title} clearly and concisely:\n\n{req.text}"
            final  = call_mistral(prompt)

        return {"summary": final, "words": len(words)}

    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "cnn_lstm_combined + Mistral 7B (HF API)",
        "rag_chunks": len(rag_chunks)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)