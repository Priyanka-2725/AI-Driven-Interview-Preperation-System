import logging
import re
from typing import List, Dict, Any, Optional

from app.features.technical_scorer import score_conceptual_answer

logger = logging.getLogger(__name__)

# Cache models lazily
_SENTENCE_MODEL = None
_SPACY_NLP = None
_MODELS_LOAD_ATTEMPTED = False

def get_sentence_model():
    global _SENTENCE_MODEL, _MODELS_LOAD_ATTEMPTED
    if _SENTENCE_MODEL is not None:
        return _SENTENCE_MODEL
    if _MODELS_LOAD_ATTEMPTED:
        return None

    try:
        from sentence_transformers import SentenceTransformer
        # Load strictly local cache without internet download
        _SENTENCE_MODEL = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
    except Exception as e:
        logger.info(f"SentenceTransformer not loaded from local cache: {e}. Using local TF-IDF evaluator.")
        _SENTENCE_MODEL = None

    _MODELS_LOAD_ATTEMPTED = True
    return _SENTENCE_MODEL

def get_spacy_nlp():
    global _SPACY_NLP
    if _SPACY_NLP is not None:
        return _SPACY_NLP
    try:
        import spacy
        _SPACY_NLP = spacy.load("en_core_web_sm")
    except Exception as e:
        logger.info(f"spaCy en_core_web_sm not loaded: {e}. Using regex tokenizer.")
        _SPACY_NLP = None
    return _SPACY_NLP

def compute_similarity(candidate: str, reference: str) -> float:
    """Computes semantic similarity (0.0 - 100.0) via SentenceTransformer or local scikit-learn TF-IDF."""
    if not candidate.strip() or not reference.strip():
        return 0.0

    model = get_sentence_model()
    if model is not None:
        try:
            embeddings = model.encode([candidate, reference])
            import numpy as np
            norm0 = np.linalg.norm(embeddings[0])
            norm1 = np.linalg.norm(embeddings[1])
            if norm0 == 0 or norm1 == 0:
                return 0.0
            cosine = float(np.dot(embeddings[0], embeddings[1]) / (norm0 * norm1))
            return max(0.0, min(100.0, cosine * 100.0))
        except Exception as e:
            logger.warning(f"SentenceTransformer inference failed: {e}. Falling back to TF-IDF.")

    # High-fidelity offline fallback combining character n-gram TF-IDF and morphological token overlap
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))
        tfidf_matrix = vectorizer.fit_transform([candidate, reference])
        char_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]) * 100.0

        c_tokens = set(w[:4] for w in re.findall(r"[a-zA-Z0-9]+", candidate.lower()) if len(w) >= 3)
        r_tokens = set(w[:4] for w in re.findall(r"[a-zA-Z0-9]+", reference.lower()) if len(w) >= 3)
        token_sim = (len(c_tokens.intersection(r_tokens)) / len(r_tokens) * 100.0) if r_tokens else 0.0

        combined = 0.5 * char_sim + 0.5 * token_sim
        return max(0.0, min(100.0, combined))
    except Exception:
        # Fallback word overlap
        c_words = set(re.findall(r"\w+", candidate.lower()))
        r_words = set(re.findall(r"\w+", reference.lower()))
        if not r_words or not c_words:
            return 0.0
        overlap = len(c_words.intersection(r_words)) / len(r_words)
        return min(100.0, overlap * 100.0)

def match_concepts(candidate: str, key_concepts: List[str]) -> tuple:
    """Matches key concepts within candidate explanation using spaCy or case-folded boundary matching."""
    if not candidate.strip() or not key_concepts:
        return [], list(key_concepts)

    candidate_lower = candidate.lower()
    matched = []
    missing = []

    nlp = get_spacy_nlp()
    if nlp is not None:
        try:
            doc = nlp(candidate_lower)
            lemmas = set(token.lemma_ for token in doc)
            text_str = " " + doc.text + " "
            for concept in key_concepts:
                c_lower = concept.lower()
                c_doc = nlp(c_lower)
                c_lemmas = [t.lemma_ for t in c_doc]
                
                # Check direct phrase in text or all lemmas present
                if c_lower in text_str or all(lem in lemmas for lem in c_lemmas):
                    matched.append(concept)
                else:
                    missing.append(concept)
            return matched, missing
        except Exception:
            pass

    # Regex word boundary fallback
    for concept in key_concepts:
        pattern = r"\b" + re.escape(concept.lower()) + r"\b"
        if re.search(pattern, candidate_lower, re.IGNORECASE):
            matched.append(concept)
        elif concept.lower() in candidate_lower:
            matched.append(concept)
        else:
            missing.append(concept)

    return matched, missing

def evaluate_conceptual_answer(
    question_text: str,
    reference_answer: str,
    key_concepts: List[str],
    candidate_answer: str
) -> Dict[str, Any]:
    words = candidate_answer.strip().split()
    word_count = len(words)

    # Determine which engine is available
    sentence_model = get_sentence_model()
    spacy_model = get_spacy_nlp()
    engine = "neural" if (sentence_model is not None or spacy_model is not None) else "fallback"

    if word_count == 0:
        return {
            "score": 0,
            "semanticSimilarity": 0.0,
            "conceptCoverage": 0.0,
            "matchedConcepts": [],
            "missingConcepts": list(key_concepts),
            "wordCount": 0,
            "feedback": f"No answer provided. Missing required concepts: {', '.join(key_concepts)}.",
            "engine": engine
        }

    similarity = compute_similarity(candidate_answer, reference_answer)
    matched, missing = match_concepts(candidate_answer, key_concepts)
    
    total_concepts = len(key_concepts)
    concept_coverage = (len(matched) / total_concepts * 100.0) if total_concepts > 0 else 100.0

    scored = score_conceptual_answer(
        semantic_similarity=similarity,
        concept_coverage=concept_coverage,
        word_count=word_count,
        matched_concepts=matched,
        missing_concepts=missing
    )

    return {
        "score": scored["overallScore"],
        "semanticSimilarity": round(similarity, 1),
        "conceptCoverage": round(concept_coverage, 1),
        "matchedConcepts": matched,
        "missingConcepts": missing,
        "wordCount": word_count,
        "feedback": scored["feedback"],
        "engine": engine
    }
