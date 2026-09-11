"""
Embedding Engine for Semantic Similarity.
Supports:
1. Fast offline Subword-NGram TF-IDF cosine embedding engine (100% offline, zero GPU/download dependency).
2. Optional sentence-transformers ('all-MiniLM-L6-v2') local dense neural embeddings when available/cached.
All embeddings are normalized to unit L2 length for fast cosine dot products.
"""

import os
import logging
from typing import List, Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingEngine:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.fallback_vectorizer = None
        self._init_model()

    def _init_model(self):
        """Initialize embedding engine; default to fast offline subword vectorizer for zero-latency SIH demo."""
        use_st = os.environ.get("USE_SENTENCE_TRANSFORMER", "false").lower() in ("true", "1", "yes")
        if use_st:
            try:
                from sentence_transformers import SentenceTransformer
                os.environ["TOKENIZERS_PARALLELISM"] = "false"
                self.model = SentenceTransformer(self.model_name)
                logger.info(f"Initialized SentenceTransformer with {self.model_name}")
                return
            except Exception as e:
                logger.warning(f"Failed loading SentenceTransformer ({e}). Falling back to subword TF-IDF.")

        # High-performance character + word n-gram vectorizer
        from sklearn.feature_extraction.text import TfidfVectorizer
        self.fallback_vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            lowercase=True,
            sublinear_tf=True
        )

    def fit_corpus(self, texts: List[str]):
        """Fit vocabulary on the material descriptions corpus."""
        if self.fallback_vectorizer is not None:
            self.fallback_vectorizer.fit(texts)

    def encode(self, texts: List[str]) -> np.ndarray:
        """
        Encode a list of text descriptions into unit-normalized vectors.
        Returns: np.ndarray of shape (len(texts), embedding_dim)
        """
        if not texts:
            return np.empty((0, 384), dtype=np.float32)

        if self.model is not None:
            embeddings = self.model.encode(
                texts,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embeddings.astype(np.float32)
        else:
            if not hasattr(self.fallback_vectorizer, "vocabulary_"):
                self.fallback_vectorizer.fit(texts)
            sparse_vecs = self.fallback_vectorizer.transform(texts)
            dense = sparse_vecs.toarray().astype(np.float32)
            norms = np.linalg.norm(dense, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            return dense / norms

    def compute_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Compute cosine similarity between two unit-normalized vectors."""
        val = float(np.dot(vec_a, vec_b))
        return max(0.0, min(1.0, val))

    def search_top_k(
        self,
        query_vec: np.ndarray,
        corpus_matrix: np.ndarray,
        top_k: int = 5
    ) -> List[Tuple[int, float]]:
        """
        Return top_k nearest candidate indices and cosine similarity scores.
        """
        if corpus_matrix.shape[0] == 0:
            return []

        sims = np.dot(corpus_matrix, query_vec)
        sims = np.clip(sims, 0.0, 1.0)

        k = min(top_k, len(sims))
        top_indices = np.argsort(sims)[::-1][:k]
        
        return [(int(idx), float(sims[idx])) for idx in top_indices]
