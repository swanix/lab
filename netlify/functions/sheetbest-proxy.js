const fetch = require('node-fetch');
const SecurityMiddleware = require('./security-middleware');

exports.handler = async (event, context) => {
  const headers = SecurityMiddleware.createHeaders();

  // Manejar preflight requests (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 🔐 VERIFICACIÓN DE AUTENTICACIÓN usando middleware centralizado
    const authResult = await SecurityMiddleware.authenticate(event);
    
    if (!authResult.success) {
      return {
        statusCode: authResult.statusCode,
        headers,
        body: JSON.stringify(authResult.body)
      };
    }

    // ✅ Usuario autenticado y autorizado - continuar con la petición a SheetBest
    const { user, ip } = authResult;
    console.log(`✅ [SheetBest Proxy] Usuario autorizado: ${user.email} (IP: ${ip})`);

    // Obtener API Key desde variables de entorno de Netlify
    const apiKey = process.env.SHEETBEST_API_KEY;
    
    if (!apiKey) {
      SecurityMiddleware.logSecurityEvent(event, 'ERROR', 'API Key no configurada', { email: user.email });
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
      SecurityMiddleware.logSecurityEvent(event, 'WARN', 'URL no proporcionada', { email: user.email });
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
      SecurityMiddleware.logSecurityEvent(event, 'WARN', 'Intento de acceso a URL no autorizada', { 
        email: user.email, 
        url: url 
      });
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

    // 🔍 Log de auditoría
    SecurityMiddleware.logSecurityEvent(event, 'INFO', 'Petición autorizada a SheetBest', { 
      email: user.email, 
      url: url 
    });

    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      SecurityMiddleware.logSecurityEvent(event, 'ERROR', 'Error desde SheetBest', { 
        email: user.email, 
        status: response.status, 
        error: errorText 
      });
      
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
    
    SecurityMiddleware.logSecurityEvent(event, 'INFO', 'Petición exitosa a SheetBest', { 
      email: user.email 
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    SecurityMiddleware.logSecurityEvent(event, 'ERROR', 'Error interno del servidor', { 
      error: error.message 
    });
    
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
