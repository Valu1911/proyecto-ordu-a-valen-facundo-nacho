"""
Segunda Vuelta - Motor de Recomendacion con Inteligencia Artificial
Algoritmo de Filtrado Basado en Contenido (Content-Based Filtering)
Utiliza vectorizacion TF-IDF, Similitud de Coseno y penalizacion Haversine geoespacial.
"""

import math
import re
import numpy as np
from typing import List, Dict, Any, Optional

def clean_text(text: str) -> List[str]:
    """Tokeniza y normaliza texto eliminando puntuacion y stopwords basicas."""
    if not text:
        return []
    text = text.lower()
    tokens = re.findall(r'[a-záéíóúñ0-9]+', text)
    stopwords = {
        'de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un',
        'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus',
        'le', 'ya', 'o', 'este', 'si', 'porque', 'esta', 'son', 'entre', 'esta',
        'muy', 'sin', 'sobre', 'este', 'tambien', 'me', 'hasta', 'hay', 'donde',
        'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni'
    }
    return [t for t in tokens if len(t) > 2 and t not in stopwords]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula la distancia en kilometros entre dos coordenadas geograficas."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999.0
    R = 6371.0  # Radio de la Tierra en km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class ContentBasedRecommender:
    """Motor de recomendacion basado en TF-IDF + Similitud Coseno + Haversine."""

    def __init__(self):
        self.category_weights = {
            'remera': ['buzo', 'campera', 'pantalon', 'bermuda'],
            'buzo': ['campera', 'remera', 'pantalon'],
            'pantalon': ['bermuda', 'remera', 'buzo', 'zapatillas'],
            'bermuda': ['pantalon', 'remera'],
            'campera': ['buzo', 'remera'],
            'zapatillas': ['pantalon', 'bermuda', 'accesorio'],
            'camiseta_futbol': ['remera', 'bermuda', 'pantalon'],
            'accesorio': ['remera', 'buzo', 'pantalon']
        }

    def build_vocabulary(self, corpus: List[List[str]]) -> Dict[str, int]:
        vocab = {}
        idx = 0
        for doc in corpus:
            for term in doc:
                if term not in vocab:
                    vocab[term] = idx
                    idx += 1
        return vocab

    def compute_tfidf(self, corpus: List[List[str]], vocab: Dict[str, int]) -> np.ndarray:
        N = len(corpus)
        V = len(vocab)
        if N == 0 or V == 0:
            return np.zeros((N, V))

        tf = np.zeros((N, V), dtype=float)
        df = np.zeros(V, dtype=float)

        for i, doc in enumerate(corpus):
            seen = set()
            for term in doc:
                if term in vocab:
                    t_idx = vocab[term]
                    tf[i, t_idx] += 1
                    if t_idx not in seen:
                        df[t_idx] += 1
                        seen.add(t_idx)

        # Suavizado de TF (logaritmico) e IDF (logaritmico inverso)
        tf = np.log1p(tf)
        idf = np.log((N + 1.0) / (df + 1.0)) + 1.0

        tfidf = tf * idf
        # Normalizacion L2 para similitud coseno
        norms = np.linalg.norm(tfidf, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return tfidf / norms

    def calculate_recommendations(
        self,
        target_product: Dict[str, Any],
        candidate_products: List[Dict[str, Any]],
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """Calcula el score hibrido de compatibilidad para cada prenda candidata."""
        if not candidate_products:
            return []

        # Filtrar la misma prenda si esta en candidatos
        valid_candidates = [
            c for c in candidate_products
            if str(c.get('id')) != str(target_product.get('id')) and c.get('status', 'active') == 'active'
        ]

        if not valid_candidates:
            return []

        # 1. Construir corpus textual (target + candidatos)
        def item_to_text(item):
            parts = [
                str(item.get('title', '')),
                str(item.get('brand', '')),
                str(item.get('category', '')),
                str(item.get('style', '')),
                str(item.get('gender', '')),
                str(item.get('description', '')),
            ]
            return clean_text(" ".join(parts))

        target_tokens = item_to_text(target_product)
        candidate_tokens_list = [item_to_text(c) for c in valid_candidates]
        all_corpus = [target_tokens] + candidate_tokens_list

        vocab = self.build_vocabulary(all_corpus)
        tfidf_matrix = self.compute_tfidf(all_corpus, vocab)

        target_vec = tfidf_matrix[0]
        cand_vecs = tfidf_matrix[1:]

        # Similitud coseno textual
        if cand_vecs.shape[0] > 0 and target_vec.shape[0] > 0:
            text_similarities = np.dot(cand_vecs, target_vec)
        else:
            text_similarities = np.zeros(len(valid_candidates))

        ref_lat = user_lat if user_lat is not None else target_product.get('location_lat')
        ref_lng = user_lng if user_lng is not None else target_product.get('location_lng')

        results = []
        for idx, item in enumerate(valid_candidates):
            text_sim = float(text_similarities[idx])

            # 2. Categorical / Style Match
            style_match = 1.0 if item.get('style') == target_product.get('style') else 0.2
            cat_match = 1.0 if item.get('category') == target_product.get('category') else 0.3
            gender_match = 1.0 if item.get('gender') in [target_product.get('gender'), 'unisex'] else 0.4
            brand_match = 1.0 if item.get('brand') and item.get('brand').lower() == str(target_product.get('brand', '')).lower() else 0.0

            category_style_score = (style_match * 0.45) + (cat_match * 0.35) + (gender_match * 0.10) + (brand_match * 0.10)

            # 3. Geospatial proximity
            item_lat = item.get('location_lat')
            item_lng = item.get('location_lng')
            dist_km = haversine_distance(ref_lat, ref_lng, item_lat, item_lng) if (ref_lat and ref_lng) else 15.0

            # Proximidad decae con la distancia (1 a 0km, 0.5 a 10km, 0.2 a 40km)
            geo_score = 1.0 / (1.0 + (dist_km / 10.0))

            # 4. Score final ponderado
            final_score = (text_sim * 0.40) + (category_style_score * 0.40) + (geo_score * 0.20)
            match_percentage = min(99, max(45, int(round(final_score * 100))))

            # 5. Generar justificacion semantica
            reasons = []
            if style_match == 1.0:
                reasons.append(f"Mismo estilo {item.get('style', '').capitalize()}")
            if brand_match == 1.0 and item.get('brand'):
                reasons.append(f"Marca {item.get('brand').capitalize()}")
            if cat_match == 1.0:
                reasons.append("Misma categoría de prenda")
            if dist_km < 10.0:
                reasons.append(f"A solo {dist_km:.1f} km de distancia")

            if not reasons:
                reasons.append("Prenda complementaria de placard")

            results.append({
                "product_id": item.get('id'),
                "title": item.get('title'),
                "brand": item.get('brand'),
                "category": item.get('category'),
                "style": item.get('style'),
                "size": item.get('size'),
                "match_percentage": match_percentage,
                "distance_km": round(dist_km, 1) if dist_km < 900 else None,
                "reason": " • ".join(reasons[:2]),
                "product": item,
            })

        # Ordenar por compatibilidad descendente
        results.sort(key=lambda x: x['match_percentage'], reverse=True)
        return results[:top_k]

recommender = ContentBasedRecommender()
