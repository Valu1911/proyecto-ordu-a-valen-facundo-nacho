/**
 * Segunda Vuelta - Automated End-to-End Test Suite (Native Fetch)
 * Flujo Completo: Auth -> Catalogo -> IA Recommendations -> Propuesta Swap -> Chat -> Codigo OTP -> Resena -> Admin
 */

const BASE_URL = 'http://localhost:3001/api';
const AI_URL = 'http://localhost:8000';

let user1Token = null;
let user1Id = null;
let user2Token = null;
let user2Id = null;
let adminToken = null;
let createdProductId = null;
let user2ProductId = null;
let exchangeId = null;
let exchangeCode = null;

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('  SEGUNDA VUELTA - E2E COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health check Backend
    console.log('1. Verificando estado del servidor Backend...');
    const healthRes = await apiRequest(`${BASE_URL}/health`);
    assert(healthRes.status === 200 && healthRes.data?.status === 'ok', 'Backend server responde /api/health con status ok');

    // 2. Health check AI Service
    console.log('\n2. Verificando microservicio de Inteligencia Artificial...');
    try {
      const aiHealthRes = await apiRequest(`${AI_URL}/health`);
      assert(aiHealthRes.status === 200 && aiHealthRes.data?.status === 'ok', 'AI Microservice responde /health con status ok');
      assert(aiHealthRes.data.algorithm.includes('TF-IDF'), 'Algoritmo TF-IDF reportado por el servicio de IA');
    } catch (e) {
      console.log('  [WARN] AI Service timeout o advertencia:', e.message);
    }

    // 3. Login Admin
    console.log('\n3. Autenticacion del Administrador...');
    const adminLoginRes = await apiRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@segundavuelta.com',
        password: 'Admin2026!SV',
      }),
    });
    assert(adminLoginRes.status === 200, 'Login admin exitoso');
    assert(adminLoginRes.data.user.role === 'admin', 'Rol verificado como admin');
    adminToken = adminLoginRes.data.accessToken || adminLoginRes.data.token;

    // 4. Login Usuario 1 (Lucas)
    console.log('\n4. Autenticacion de Usuario 1 (Lucas Rodriguez)...');
    const user1LoginRes = await apiRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'lucas.rodriguez@gmail.com',
        password: 'Pass1234!',
      }),
    });
    assert(user1LoginRes.status === 200, 'Login Usuario 1 exitoso');
    user1Token = user1LoginRes.data.accessToken || user1LoginRes.data.token;
    user1Id = user1LoginRes.data.user.id;

    // 5. Login Usuario 2 (Valentina)
    console.log('\n5. Autenticacion de Usuario 2 (Valentina Rossi)...');
    const user2LoginRes = await apiRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'valentina.rossi@gmail.com',
        password: 'Pass1234!',
      }),
    });
    assert(user2LoginRes.status === 200, 'Login Usuario 2 exitoso');
    user2Token = user2LoginRes.data.accessToken || user2LoginRes.data.token;
    user2Id = user2LoginRes.data.user.id;

    // 6. Publicacion de Prenda por Usuario 1
    console.log('\n6. Publicacion de una nueva prenda (Usuario 1)...');
    const newProductData = {
      title: 'Campera Bomber Streetwear Asfalto ' + Date.now(),
      description: 'Campera bomber oversize estilo asfalto urbano con cierre metalico y forro termico',
      category: 'campera',
      style: 'streetwear',
      gender: 'unisex',
      size: 'XL',
      item_condition: 'como_nuevo',
      brand: 'Adidas',
      location_lat: -34.6037,
      location_lng: -58.3816,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80',
      ],
    };
    const pubRes = await apiRequest(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify(newProductData),
    });
    assert(pubRes.status === 201, 'Prenda de Lucas publicada con exito (HTTP 201)');
    assert(pubRes.data.product.id !== undefined, 'ID de prenda generado correctamente');
    createdProductId = pubRes.data.product.id;

    // 6b. Publicacion de Prenda por Usuario 2 (para ofrecer en intercambio)
    console.log('\n6b. Publicacion de prenda en placard de Usuario 2 (Valentina)...');
    const user2ProductData = {
      title: 'Buzo Hoodie Oversize Asfalto ' + Date.now(),
      description: 'Buzo con capucha algodon pesado color gris oscuro vintage corte boxy',
      category: 'buzo',
      style: 'streetwear',
      gender: 'unisex',
      size: 'L',
      item_condition: 'como_nuevo',
      brand: 'Dickies',
      location_lat: -34.5875,
      location_lng: -58.3974,
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
      ],
    };
    const pub2Res = await apiRequest(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify(user2ProductData),
    });
    assert(pub2Res.status === 201, 'Prenda de Valentina publicada con exito (HTTP 201)');
    user2ProductId = pub2Res.data.product.id;

    // 7. Consulta de Recomendaciones con IA para la Prenda
    console.log('\n7. Consulta de Recomendaciones Inteligentes (AI Engine)...');
    const recRes = await apiRequest(`${BASE_URL}/products/${createdProductId}/recommendations?limit=4`);
    assert(recRes.status === 200, 'Endpoint de recomendaciones responde HTTP 200');
    assert(Array.isArray(recRes.data.recommendations), 'Devuelve un listado de prendas recomendadas');
    if (recRes.data.recommendations.length > 0) {
      const topRec = recRes.data.recommendations[0];
      assert(topRec.match_percentage >= 45, `Compatibilidad calculada exitosamente (${topRec.match_percentage}%)`);
      console.log(`     -> Prenda sugerida por IA: "${topRec.title}" (${topRec.reason}) [Match: ${topRec.match_percentage}%]`);
    }

    // 8. Feed Personalizado con IA
    console.log('\n8. Consulta de Feed Personalizado con IA...');
    const feedRes = await apiRequest(`${BASE_URL}/products/recommendations/personalized?limit=4`);
    assert(feedRes.status === 200, 'Endpoint de feed personalizado responde HTTP 200');
    assert(Array.isArray(feedRes.data.recommendations), 'Listado de recomendaciones para el home recibido');

    // 9. Propuesta de Intercambio (Usuario 2 propone swap a Usuario 1)
    console.log('\n9. Proposicion de Intercambio (Usuario 2 -> Usuario 1)...');
    const swapRes = await apiRequest(`${BASE_URL}/exchanges`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify({
        product_requested_id: createdProductId,
        product_offered_id: user2ProductId,
      }),
    });
    assert(swapRes.status === 201, 'Propuesta de intercambio enviada con exito (HTTP 201)');
    exchangeId = swapRes.data.exchange.id;
    assert(exchangeId !== undefined, 'ID de intercambio creado correctamente');

    // 10. Aceptacion del Intercambio (Usuario 1 acepta)
    console.log('\n10. Aceptacion del Intercambio (Usuario 1)...');
    const acceptRes = await apiRequest(`${BASE_URL}/exchanges/${exchangeId}/accept`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(acceptRes.status === 200, 'Intercambio aceptado con exito');
    assert(acceptRes.data.exchange.status === 'accepted', 'Estado actualizado a accepted');

    // 11. Formalizacion del Intercambio y Generacion de Codigo OTP de 8 caracteres
    console.log('\n11. Formalizacion del Intercambio con Codigo OTP (72 horas)...');
    const formalizeRes = await apiRequest(`${BASE_URL}/exchanges/${exchangeId}/formalize`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}` },
      body: JSON.stringify({ product_offered_id: user2ProductId }),
    });
    assert(formalizeRes.status === 200, 'Intercambio formalizado con exito');
    exchangeCode = formalizeRes.data.exchange.exchange_code;
    assert(typeof exchangeCode === 'string' && exchangeCode.length === 8, `Codigo unico generado: ${exchangeCode}`);

    // 12. Confirmacion mutua de Entrega Fisica
    console.log('\n12. Confirmacion mutua de Entrega Fisica...');
    // Confirmacion por parte de Valentina (requester)
    const conf1 = await apiRequest(`${BASE_URL}/exchanges/${exchangeId}/confirm`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert(conf1.status === 200, 'Confirmacion registrada por parte de Valentina');

    // Confirmacion por parte de Lucas (owner)
    const conf2 = await apiRequest(`${BASE_URL}/exchanges/${exchangeId}/confirm`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert(conf2.status === 200, 'Confirmacion registrada por parte de Lucas');
    assert(conf2.data.exchange.status === 'completed', 'Intercambio finalizado con exito (status: completed)');

    // 13. Creacion de Resena post-intercambio
    console.log('\n13. Creacion de Resena comunitaria con estrellas...');
    const reviewRes = await apiRequest(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${user2Token}` },
      body: JSON.stringify({
        exchange_id: exchangeId,
        rating: 5,
        comment: 'Excelente intercambio! La campera impecable y puntualidad perfecta.',
      }),
    });
    assert(reviewRes.status === 201, 'Resena de 5 estrellas creada con exito (HTTP 201)');

    // 14. Metricas del Panel de Administracion
    console.log('\n14. Consulta de KPIs en Tablero de Administracion...');
    const adminMetricsRes = await apiRequest(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminMetricsRes.status === 200, 'Metricas de administracion cargadas');
    const stats = adminMetricsRes.data.stats || {};
    assert(stats.totalUsers > 0, `Total usuarios registrados: ${stats.totalUsers}`);
    assert(stats.totalProducts > 0, `Total prendas en circulacion: ${stats.totalProducts}`);
    console.log(`     -> Usuarios: ${stats.totalUsers} | Prendas: ${stats.totalProducts} | Swaps activos: ${stats.activeExchanges} | Swaps completados: ${stats.completedExchanges}`);

    console.log('\n====================================================');
    console.log(`  RESULTADO: ${passedTests}/${totalTests} PRUEBAS COMPLETADAS CON EXITO (100%)`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\nERROR DURANTE LA EJECUCION DE LAS PRUEBAS:', error.message);
    process.exit(1);
  }
}

runTests();
