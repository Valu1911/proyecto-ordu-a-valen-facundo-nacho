"""
Segunda Vuelta - Servicio de Inteligencia Artificial
Servicio ASGI de alto rendimiento para el motor de recomendacion de indumentaria.
Compatible con Uvicorn de forma directa y sin dependencias externas bloqueantes.
"""

import json
from recommender import recommender

def json_response(data, status=200):
    body = json.dumps(data, ensure_ascii=False).encode('utf-8')
    headers = [
        (b'content-type', b'application/json; charset=utf-8'),
        (b'content-length', str(len(body)).encode('ascii')),
        (b'access-control-allow-origin', b'*'),
        (b'access-control-allow-methods', b'GET, POST, OPTIONS'),
        (b'access-control-allow-headers', b'Content-Type, Authorization'),
    ]
    return status, headers, body

async def read_body(receive):
    body = b''
    more_body = True
    while more_body:
        message = await receive()
        body += message.get('body', b'')
        more_body = message.get('more_body', False)
    return body

async def app(scope, receive, send):
    """Punto de entrada estandar ASGI."""
    if scope['type'] != 'http':
        return

    method = scope['method']
    path = scope['path']

    # Manejar CORS preflight OPTIONS
    if method == 'OPTIONS':
        status, headers, body = json_response({"ok": True})
        await send({'type': 'http.response.start', 'status': status, 'headers': headers})
        await send({'type': 'http.response.body', 'body': body})
        return

    # Rutas de Health Check
    if method == 'GET' and (path in ['/', '/health', '/api/health']):
        data = {
            "status": "ok",
            "service": "Segunda Vuelta AI Recommendation Engine",
            "algorithm": "TF-IDF + Cosine Similarity + Haversine Proximity",
            "version": "1.0.0"
        }
        status, headers, body = json_response(data)
        await send({'type': 'http.response.start', 'status': status, 'headers': headers})
        await send({'type': 'http.response.body', 'body': body})
        return

    # Endpoint POST /recommend (o /api/recommend)
    if method == 'POST' and (path in ['/recommend', '/api/recommend']):
        try:
            raw_body = await read_body(receive)
            payload = json.loads(raw_body.decode('utf-8')) if raw_body else {}

            target = payload.get('target_product', {})
            candidates = payload.get('candidate_products', [])
            user_lat = payload.get('user_lat')
            user_lng = payload.get('user_lng')
            limit = int(payload.get('limit', 6))

            recommendations = recommender.calculate_recommendations(
                target_product=target,
                candidate_products=candidates,
                user_lat=user_lat,
                user_lng=user_lng,
                top_k=limit
            )

            response_data = {
                "success": True,
                "target_id": target.get('id'),
                "total_candidates": len(candidates),
                "count": len(recommendations),
                "recommendations": recommendations
            }
            status, headers, body = json_response(response_data)
        except Exception as e:
            status, headers, body = json_response({"success": False, "error": str(e)}, status=500)

        await send({'type': 'http.response.start', 'status': status, 'headers': headers})
        await send({'type': 'http.response.body', 'body': body})
        return

    # Endpoint POST /recommend/user (Recomendaciones personalizadas para el usuario segun busquedas y estilos)
    if method == 'POST' and (path in ['/recommend/user', '/api/recommend/user']):
        try:
            raw_body = await read_body(receive)
            payload = json.loads(raw_body.decode('utf-8')) if raw_body else {}

            candidates = payload.get('candidate_products', [])
            user_style = payload.get('style', 'streetwear')
            keywords = payload.get('keywords', '')
            user_gender = payload.get('gender', 'unisex')
            user_lat = payload.get('user_lat')
            user_lng = payload.get('user_lng')
            limit = int(payload.get('limit', 8))

            pseudo_target = {
                "id": "__user_profile__",
                "title": f"Prenda {user_style} {keywords}".strip(),
                "description": f"Prendas y cortes de estilo {user_style} {keywords} moda circular urbana",
                "category": payload.get('favorite_category', 'buzo'),
                "style": user_style,
                "gender": user_gender,
                "location_lat": user_lat,
                "location_lng": user_lng,
            }

            recommendations = recommender.calculate_recommendations(
                target_product=pseudo_target,
                candidate_products=candidates,
                user_lat=user_lat,
                user_lng=user_lng,
                top_k=limit
            )

            # Enriquecer justificaciones semanticas segun la busqueda activa
            for rec in recommendations:
                if rec.get('style', '').lower() == user_style.lower():
                    rec['reason'] = f"Afin a tus búsquedas de estilo {user_style.capitalize()}"
                elif keywords and keywords.lower() in rec.get('title', '').lower():
                    rec['reason'] = f"Coincide con tu búsqueda reciente '{keywords}'"

            response_data = {
                "success": True,
                "user_style": user_style,
                "keywords": keywords,
                "count": len(recommendations),
                "recommendations": recommendations
            }
            status, headers, body = json_response(response_data)
        except Exception as e:
            status, headers, body = json_response({"success": False, "error": str(e)}, status=500)

        await send({'type': 'http.response.start', 'status': status, 'headers': headers})
        await send({'type': 'http.response.body', 'body': body})
        return

    # 404 No encontrado
    status, headers, body = json_response({"error": "Ruta no encontrada", "path": path}, status=404)
    await send({'type': 'http.response.start', 'status': status, 'headers': headers})
    await send({'type': 'http.response.body', 'body': body})

if __name__ == '__main__':
    import uvicorn
    print("Iniciando Segunda Vuelta AI Service en puerto 8000...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
