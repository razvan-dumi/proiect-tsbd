#!/usr/bin/env bash
# Download the augmented all-MiniLM-L6-v2 ONNX model used for in-DB embeddings.
# The .onnx file is gitignored (~86 MB).
set -euo pipefail
cd "$(dirname "$0")"
URL="https://objectstorage.eu-frankfurt-1.oraclecloud.com/n/fro8fl9kuqli/b/AIVECTORS/o/all-MiniLM-L6-v2.onnx"
curl -fSL --progress-bar -o all_MiniLM_L6_v2_augmented.onnx "$URL"
echo "✓ saved to oracle/models/all_MiniLM_L6_v2_augmented.onnx"
