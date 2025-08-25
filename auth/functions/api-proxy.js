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
    // Obtener configuración desde variables de entorno
    const apiKey = process.env.API_PROXY_KEY;
    const allowedDomains = process.env.API_PROXY_ALLOWED_DOMAINS || '';
    const serviceName = process.env.API_PROXY_SERVICE_NAME || 'API';
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'API Key no configurada en el servidor',
          suggestion: `Verifica que API_PROXY_KEY esté configurada en Netlify`,
          code: 'MISSING_API_KEY'
        })
      };
    }

    // Extraer la URL de la API de los query parameters
    const { url } = event.queryStringParameters || {};
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `URL de ${serviceName} no proporcionada`,
          suggestion: `Proporciona la URL como query parameter: ?url=https://api.${serviceName.toLowerCase()}.com/...`,
          code: 'MISSING_URL'
        })
      };
    }

    // Validar que la URL está en los dominios permitidos
    const allowedDomainsList = allowedDomains.split(',').map(d => d.trim());
    const isAllowedDomain = allowedDomainsList.some(domain => url.includes(domain));
    
    if (!isAllowedDomain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `URL no válida para ${serviceName}`,
          suggestion: `La URL debe ser de uno de estos dominios: ${allowedDomains}`,
          code: 'INVALID_URL'
        })
      };
    }

    // Configurar headers según el servicio
    const requestHeaders = {
      'Content-Type': 'application/json'
    };

    // Agregar API key según el tipo de servicio
    if (serviceName.toLowerCase() === 'sheetbest') {
      requestHeaders['X-Api-Key'] = apiKey;
    } else {
      // Para otros servicios, usar Authorization Bearer
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
      headers: requestHeaders,
      timeout: 10000 // 10 segundos de timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `Error desde ${serviceName}: ${response.status}`,
          details: errorText,
          code: `${serviceName.toUpperCase()}_ERROR`
        })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('[API Proxy] Error proxying request:', error);
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

