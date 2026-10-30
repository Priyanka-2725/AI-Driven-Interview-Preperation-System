import pytest
from unittest.mock import MagicMock, patch
import numpy as np

from app.features.nlp_evaluator import (
    compute_similarity,
    match_concepts,
    evaluate_conceptual_answer
)

def test_nlp_evaluation_semantic_similarity_offline():
    ref = "Database indexes use balanced B-Trees to provide O(log N) search times and minimize disk I/O."
    candidate_good = "A database index utilizes B-Tree structures to ensure logarithmic search time and reduce disk I/O operations."
    candidate_unrelated = "Chocolate cake recipe with flour, eggs, cocoa powder, and sugar baked at 350 degrees."

    sim_good = compute_similarity(candidate_good, ref)
    sim_unrelated = compute_similarity(candidate_unrelated, ref)

    assert sim_good > 40.0
    assert sim_unrelated < 20.0
    assert sim_good > sim_unrelated

def test_nlp_evaluation_concept_matching():
    candidate = "We use a B-Tree for indexing to achieve O(log N) lookup time and minimize disk I/O."
    key_concepts = ["B-Tree", "O(log N)", "disk I/O", "page fill factor"]

    matched, missing = match_concepts(candidate, key_concepts)
    assert "B-Tree" in matched
    assert "O(log N)" in matched
    assert "disk I/O" in matched
    assert "page fill factor" in missing

def test_nlp_evaluation_empty_answer():
    res = evaluate_conceptual_answer(
        question_text="Explain B-Trees",
        reference_answer="B-Trees are balanced search trees...",
        key_concepts=["B-Tree", "O(log N)"],
        candidate_answer=""
    )
    assert res["score"] == 0
    assert res["wordCount"] == 0
    assert res["semanticSimilarity"] == 0.0
    assert res["conceptCoverage"] == 0.0
    assert len(res["matchedConcepts"]) == 0
    assert len(res["missingConcepts"]) == 2

def test_nlp_evaluation_short_answer_penalty():
    res = evaluate_conceptual_answer(
        question_text="Explain B-Trees",
        reference_answer="B-Trees are balanced search trees...",
        key_concepts=["B-Tree", "O(log N)"],
        candidate_answer="It uses a B-Tree."  # 4 words (< 15 words)
    )
    assert res["wordCount"] == 4
    # Structure score will be 0, keeping the score in the partial range (40-70)
    assert 40 <= res["score"] <= 60

def test_nlp_evaluation_off_topic_answer():
    """Verifies that completely off-topic answers score below 20 with specific missing concepts."""
    res = evaluate_conceptual_answer(
        question_text="Explain database indexing and B-Trees.",
        reference_answer="Database indexes use balanced B-Trees to provide O(log N) search times and minimize disk I/O.",
        key_concepts=["B-Tree", "O(log N)", "disk I/O"],
        candidate_answer="Chocolate cake recipe with flour, eggs, sugar, cocoa powder, and butter baked at 350 degrees."
    )
    assert res["score"] < 20
    assert len(res["missingConcepts"]) == 3
    assert "B-Tree" in res["feedback"]
    assert "key details" not in res["feedback"]

def test_nlp_with_mocked_sentence_transformer():
    """Verifies SentenceTransformer inference execution without network calls using mocked embeddings."""
    mock_model = MagicMock()
    # Mock unit vectors with high cosine similarity
    mock_model.encode.return_value = np.array([
        [1.0, 0.0, 0.0],
        [0.9, 0.435, 0.0]
    ])

    with patch("app.features.nlp_evaluator.get_sentence_model", return_value=mock_model):
        sim = compute_similarity("High level test", "Reference text")
        assert 85.0 <= sim <= 95.0

def test_nlp_live_neural_cache_check():
    """Verifies SentenceTransformer and spaCy run for real via neural engine (never skips)."""
    from app.features.nlp_evaluator import get_sentence_model, get_spacy_nlp
    sentence_model = get_sentence_model()
    spacy_nlp = get_spacy_nlp()
    assert sentence_model is not None, "SentenceTransformer all-MiniLM-L6-v2 must be cached and loadable"
    assert spacy_nlp is not None, "spaCy en_core_web_sm model must be installed and loadable"

    res = evaluate_conceptual_answer(
        question_text="Explain database indexing and B-Trees.",
        reference_answer="Database indexes use balanced B-Trees to provide O(log N) search times and minimize disk I/O.",
        key_concepts=["B-Tree", "O(log N)", "disk I/O"],
        candidate_answer="A database index uses B-Tree structures to achieve logarithmic O(log N) search times and reduce disk I/O."
    )
    assert res["engine"] == "neural"
    assert res["score"] >= 80
