#!/bin/bash
# ==============================================================================
# Placyra: Pull Ollama Models (nomic-embed-text and llama3)
# ==============================================================================
set -e

OLLAMA_HOST="${OLLAMA_BASE_URL:-http://localhost:11434}"
EMBED_MODEL="${OLLAMA_EMBED_MODEL:-nomic-embed-text}"
LLM_MODEL="${OLLAMA_LLM_MODEL:-llama3}"

echo "=================================================="
echo "Placyra AI Model Downloader"
echo "Target Ollama Instance: $OLLAMA_HOST"
echo "Embeddings Model:       $EMBED_MODEL"
echo "LLM Chat Model:         $LLM_MODEL"
echo "=================================================="

# Check if Ollama is reachable
echo "[1/3] Checking Ollama connectivity..."
if ! curl -s "$OLLAMA_HOST/api/tags" > /dev/null; then
    echo "WARNING: Ollama instance at $OLLAMA_HOST is not reachable yet."
    echo "If running with Docker Compose, ensure the 'ollama' container is running:"
    echo "  docker compose up -d ollama"
    exit 1
fi
echo "Ollama is online!"

# Pull nomic-embed-text
echo "[2/3] Pulling $EMBED_MODEL embedding model..."
curl -X POST "$OLLAMA_HOST/api/pull" -d "{\"name\": \"$EMBED_MODEL\"}"
echo -e "\nEmbedding model $EMBED_MODEL ready."

# Pull llama3
echo "[3/3] Pulling $LLM_MODEL LLM model..."
curl -X POST "$OLLAMA_HOST/api/pull" -d "{\"name\": \"$LLM_MODEL\"}"
echo -e "\nLLM model $LLM_MODEL ready."

echo "=================================================="
echo "All required Placyra AI models successfully initialized!"
echo "=================================================="
