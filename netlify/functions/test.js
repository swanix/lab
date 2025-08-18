// Función de prueba para verificar que las funciones de Netlify están funcionando

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Manejar preflight requests (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('🧪 [Test Function] Función de prueba ejecutada correctamente');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Función de prueba funcionando correctamente',
        timestamp: new Date().toISOString(),
        method: event.httpMethod,
        path: event.path,
        queryParams: event.queryStringParameters || {},
        headers: event.headers
      })
    };

  } catch (error) {
    console.error('❌ [Test Function] Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error en función de prueba',
        details: error.message
      })
    };
  }
};
