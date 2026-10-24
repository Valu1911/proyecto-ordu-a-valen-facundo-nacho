import { Product, User } from '../models/index.js';
import { Op } from 'sequelize';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const aiService = {
  /**
   * Obtiene prendas recomendadas por similitud de contenido, estilo y cercania geografica.
   */
  async getRecommendationsForProduct(productId, userLat = null, userLng = null, limit = 6) {
    try {
      const target = await Product.findByPk(productId, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'display_name', 'location_city'] }],
      });

      if (!target) return [];

      // Obtener prendas candidatas activas
      const candidates = await Product.findAll({
        where: {
          status: 'active',
          id: { [Op.ne]: productId },
        },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'display_name', 'avatar_url', 'rating_avg', 'location_city'],
          },
        ],
        limit: 50,
      });

      if (candidates.length === 0) return [];

      // Intentar llamar al microservicio de Python FastAPI / ASGI
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(`${AI_URL}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_product: target.toJSON(),
            candidate_products: candidates.map((c) => c.toJSON()),
            user_lat: userLat || target.location_lat,
            user_lng: userLng || target.location_lng,
            limit,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.recommendations && data.recommendations.length > 0) {
            return data.recommendations;
          }
        }
      } catch (aiErr) {
        // Fallback local silencioso si el microservicio esta en cold start
      }

      // Fallback algoritmico en Node.js
      return this.localFallbackRecommendations(target, candidates, userLat, userLng, limit);
    } catch (error) {
      console.error('Error en aiService.getRecommendationsForProduct:', error);
      return [];
    }
  },

  /**
   * Recomendaciones personalizadas para el feed del usuario segun su historial de busqueda y gustos.
   */
  async getPersonalizedFeed(user, limit = 8, preferredStyle = 'streetwear', keywords = '') {
    try {
      const candidates = await Product.findAll({
        where: {
          status: 'active',
          ...(user ? { user_id: { [Op.ne]: user.id } } : {}),
        },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'display_name', 'avatar_url', 'rating_avg', 'location_city'],
          },
        ],
        order: [['views_count', 'DESC']],
        limit: 40,
      });

      if (candidates.length === 0) return [];

      // Intentar llamar a microservicio IA
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);

        const resp = await fetch(`${AI_URL}/recommend/user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidate_products: candidates.map((c) => c.toJSON()),
            style: preferredStyle || 'streetwear',
            keywords: keywords || '',
            user_lat: user?.location_lat,
            user_lng: user?.location_lng,
            limit,
          }),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.recommendations && data.recommendations.length > 0) {
            return data.recommendations;
          }
        }
      } catch (e) {
        // Continuar con fallback
      }

      // Fallback local inteligente
      return candidates
        .map((c) => {
          let score = 65;
          let reason = `Tendencia ${c.style || 'streetwear'} recomendada`;

          if (preferredStyle && c.style && c.style.toLowerCase() === preferredStyle.toLowerCase()) {
            score += 25;
            reason = `Basado en tu búsqueda de estilo ${c.style}`;
          }
          if (keywords && (c.title.toLowerCase().includes(keywords.toLowerCase()) || c.description.toLowerCase().includes(keywords.toLowerCase()))) {
            score += 20;
            reason = `Coincide con tus búsquedas: "${keywords}"`;
          }

          return {
            product_id: c.id,
            title: c.title,
            brand: c.brand,
            category: c.category,
            style: c.style,
            size: c.size,
            match_percentage: Math.min(99, score),
            reason,
            product: c,
          };
        })
        .sort((a, b) => b.match_percentage - a.match_percentage)
        .slice(0, limit);
    } catch (error) {
      console.error('Error en aiService.getPersonalizedFeed:', error);
      return [];
    }
  },

  localFallbackRecommendations(target, candidates, userLat, userLng, limit) {
    const refLat = userLat || target.location_lat;
    const refLng = userLng || target.location_lng;

    const scored = candidates.map((cand) => {
      let score = 0.5;
      const reasons = [];

      if (cand.style === target.style) {
        score += 0.25;
        reasons.push(`Mismo estilo ${cand.style}`);
      }
      if (cand.category === target.category) {
        score += 0.15;
        reasons.push(`Misma categoria ${cand.category}`);
      }
      if (cand.brand && target.brand && cand.brand.toLowerCase() === target.brand.toLowerCase()) {
        score += 0.15;
        reasons.push(`Marca ${cand.brand}`);
      }

      const dist = haversineDistance(refLat, refLng, cand.location_lat, cand.location_lng);
      if (dist < 10) {
        score += 0.1;
        reasons.push(`A solo ${dist.toFixed(1)} km`);
      }

      const matchPercentage = Math.min(98, Math.max(50, Math.round(score * 100)));

      return {
        product_id: cand.id,
        title: cand.title,
        brand: cand.brand,
        category: cand.category,
        style: cand.style,
        size: cand.size,
        match_percentage: matchPercentage,
        distance_km: dist < 900 ? Number(dist.toFixed(1)) : null,
        reason: reasons.slice(0, 2).join(' • ') || 'Prenda sugerida para intercambio',
        product: cand,
      };
    });

    scored.sort((a, b) => b.match_percentage - a.match_percentage);
    return scored.slice(0, limit);
  },
};
