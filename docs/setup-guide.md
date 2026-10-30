# Setup Guide

## Python Environment
This project requires Python 3.10.11. 
Please ensure you have Python 3.10.11 installed before creating your virtual environment.

## Utility Scripts
Utility scripts are located in the `scripts/` directory for starting the stack (`dev-all`) and checking system health (`check-health`).
- **macOS/Linux contributors**: Use the `.sh` versions (e.g., `./scripts/dev-all.sh`).
- **Windows contributors**: The `.sh` versions may be unusable in standard PowerShell or due to CRLF issues. Please use the natively supported `.ps1` equivalents (e.g., `.\scripts\dev-all.ps1`).

## Week 3 Offline Model Setup
For technical assessment evaluation (offline Sentence-BERT semantic similarity and spaCy concept coverage):
1. **Activate Python Virtual Environment**:
   ```bash
   cd ml-service
   .\.venv\Scripts\activate   # On Linux/macOS: source .venv/bin/activate
   ```
2. **Download spaCy English Model**:
   ```bash
   python -m spacy download en_core_web_sm
   ```
3. **Pre-Cache Sentence-BERT Weights**:
   ```python
   python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
   ```
   This downloads the weights once locally (~80MB), allowing complete offline execution during interview evaluations.
