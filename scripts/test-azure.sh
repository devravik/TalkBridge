#!/usr/bin/env bash
set -euo pipefail

# Load .env from repo root
ENV_FILE="$(dirname "$0")/../.env"
if [[ -f "$ENV_FILE" ]]; then
  export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

KEY="${AZURE_TRANSLATOR_KEY:-}"
REGION="${AZURE_TRANSLATOR_REGION:-}"

if [[ -z "$KEY" ]]; then
  echo "ERROR: AZURE_TRANSLATOR_KEY is not set in .env"
  exit 1
fi
if [[ -z "$REGION" ]]; then
  echo "ERROR: AZURE_TRANSLATOR_REGION is not set in .env"
  exit 1
fi

echo "Key    : ${KEY:0:8}...${KEY: -4}"
echo "Region : $REGION"
echo ""

PAIRS=(
  "en|es|Hello, how are you?"
  "es|en|Hola, ¿cómo estás?"
  "en|hi|Good morning"
  "hi|en|नमस्ते"
)

ALL_OK=true
for PAIR in "${PAIRS[@]}"; do
  SRC=$(echo "$PAIR" | cut -d'|' -f1)
  TGT=$(echo "$PAIR" | cut -d'|' -f2)
  TEXT=$(echo "$PAIR" | cut -d'|' -f3)

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${SRC}&to=${TGT}" \
    -H "Ocp-Apim-Subscription-Key: $KEY" \
    -H "Ocp-Apim-Subscription-Region: $REGION" \
    -H "Content-Type: application/json" \
    -d "[{\"text\": \"$TEXT\"}]")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -1)

  if [[ "$HTTP_CODE" == "200" ]]; then
    TRANSLATED=$(echo "$BODY" | grep -o '"text":"[^"]*"' | head -1 | sed 's/"text":"//;s/"//')
    printf "  ✓  [%s→%s]  \"%s\"  →  \"%s\"\n" "$SRC" "$TGT" "$TEXT" "$TRANSLATED"
  else
    printf "  ✗  [%s→%s]  HTTP %s — %s\n" "$SRC" "$TGT" "$HTTP_CODE" "$BODY"
    ALL_OK=false
  fi
done

echo ""
if $ALL_OK; then
  echo "All tests passed — Azure Translator is working correctly."
else
  echo "Some tests failed. Check key, region, and Azure portal for quota/errors."
  exit 1
fi
