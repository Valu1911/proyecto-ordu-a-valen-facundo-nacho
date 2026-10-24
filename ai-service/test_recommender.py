from recommender import recommender

sample_target = {
    "id": "prod-1",
    "title": "Buzo Oversize Dickies Negro",
    "brand": "Dickies",
    "category": "buzo",
    "style": "streetwear",
    "gender": "unisex",
    "size": "L",
    "description": "Buzo negro con capucha algodon pesado corte skate streetwear",
    "location_lat": -34.588,
    "location_lng": -58.430,
    "status": "active"
}

sample_candidates = [
    {
        "id": "prod-2",
        "title": "Campera The North Face Nuptse Vintage",
        "brand": "The North Face",
        "category": "campera",
        "style": "streetwear",
        "gender": "unisex",
        "size": "L",
        "description": "Campera de abrigo pluma vintage estilo urbano asfalto",
        "location_lat": -34.590,
        "location_lng": -58.435,
        "status": "active"
    },
    {
        "id": "prod-3",
        "title": "Zapatillas Nike Dunk Low Retro Panda",
        "brand": "Nike",
        "category": "zapatillas",
        "style": "streetwear",
        "gender": "unisex",
        "size": "42",
        "description": "Zapatillas clasicas streetwear blanco y negro",
        "location_lat": -34.600,
        "location_lng": -58.420,
        "status": "active"
    },
    {
        "id": "prod-4",
        "title": "Camisa Formal Zara Slim Blanca",
        "brand": "Zara",
        "category": "camisa",
        "style": "formal",
        "gender": "hombre",
        "size": "M",
        "description": "Camisa para oficina cuello italiano blanca",
        "location_lat": -34.800,
        "location_lng": -58.700,
        "status": "active"
    }
]

recommendations = recommender.calculate_recommendations(
    target_product=sample_target,
    candidate_products=sample_candidates,
    user_lat=-34.588,
    user_lng=-58.430,
    top_k=3
)

print(f"Test OK! Generated {len(recommendations)} recommendations:")
for r in recommendations:
    print(f"- [{r['match_percentage']}%] {r['title']} ({r['reason']}) - Dist: {r['distance_km']}km")
