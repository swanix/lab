const fetch = require('node-fetch');

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
    // Obtener API Key desde variables de entorno de Netlify
    const apiKey = process.env.SHEETBEST_API_KEY;
    
    if (!apiKey) {
      console.error('[SheetBest Proxy] API Key no configurada');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'API Key no configurada en el servidor',
          suggestion: 'Verifica que SHEETBEST_API_KEY esté configurada en Netlify',
          code: 'MISSING_API_KEY'
        })
      };
    }

    // Extraer la URL de SheetBest de los query parameters
    const { url } = event.queryStringParameters || {};
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'URL de SheetBest no proporcionada',
          suggestion: 'Proporciona la URL como query parameter: ?url=https://api.sheetbest.com/...',
          code: 'MISSING_URL'
        })
      };
    }

    // Validar que la URL es de SheetBest
    if (!url.includes('api.sheetbest.com')) {
      console.warn('[SheetBest Proxy] Intento de acceso a URL no autorizada:', url);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'URL no válida para SheetBest',
          suggestion: 'La URL debe ser de api.sheetbest.com',
          code: 'INVALID_URL'
        })
      };
    }

    console.log('[SheetBest Proxy] Petición autorizada a:', url);

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SheetBest Proxy] Error from SheetBest: ${response.status} - ${errorText}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Error desde SheetBest: ${response.status}`,
          details: errorText,
          code: 'SHEETBEST_ERROR'
        })
      };
    }

    const data = await response.json();
    
    console.log('[SheetBest Proxy] Petición exitosa');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[SheetBest Proxy] Error proxying request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message,
        code: 'INTERNAL_ERROR'
      })
    };
  }
};
