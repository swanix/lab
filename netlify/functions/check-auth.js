// Función mejorada de verificación de autenticación con rate limiting

// Simulación de rate limiting (en producción usar Redis o similar)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 100; // máximo 100 requests por 15 minutos

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= MAX_REQUESTS) {
    return false;
  }
  
  validRequests.push(now);
  requestCounts.set(ip, validRequests);
  return true;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://your-site.netlify.app',
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
    // 🔍 Rate limiting
    const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`🚨 [Auth Check] Rate limit excedido - IP: ${clientIP}`);
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Demasiadas peticiones',
          message: 'Intenta nuevamente en 15 minutos',
          code: 'RATE_LIMIT_EXCEEDED'
        })
      };
    }

    // Obtener sesión desde query parameters
    const { session } = event.queryStringParameters || {};
    
    if (!session) {
      console.warn(`🚨 [Auth Check] Intento de acceso sin sesión - IP: ${clientIP}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'No autenticado',
          message: 'Debes iniciar sesión con Google para acceder al diagrama',
          code: 'UNAUTHORIZED'
        })
      };
    }

    let sessionData;
    try {
      sessionData = JSON.parse(decodeURIComponent(session));
    } catch (error) {
      console.warn(`🚨 [Auth Check] Sesión inválida - IP: ${clientIP}, Error: ${error.message}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Sesión inválida',
          message: 'Debes iniciar sesión nuevamente',
          code: 'INVALID_SESSION'
        })
      };
    }

    // Verificar que la sesión no haya expirado
    if (sessionData.expires_at && Date.now() > sessionData.expires_at) {
      console.warn(`🚨 [Auth Check] Sesión expirada - IP: ${clientIP}, Email: ${sessionData.user?.email}`);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Sesión expirada',
          message: 'Debes iniciar sesión nuevamente',
          code: 'EXPIRED_SESSION'
        })
      };
    }

    // Verificar que el usuario tenga un email de Google
    if (!sessionData.user || !sessionData.user.email || !sessionData.user.email.endsWith('@gmail.com')) {
      console.warn(`🚨 [Auth Check] Intento de acceso con email no autorizado - IP: ${clientIP}, Email: ${sessionData.user?.email}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Acceso denegado',
          message: 'Solo se permiten cuentas de Google (@gmail.com)',
          code: 'FORBIDDEN'
        })
      };
    }
    
    // ✅ Acceso autorizado
    console.log(`✅ [Auth Check] Acceso autorizado - IP: ${clientIP}, Email: ${sessionData.user.email}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        user: {
          email: sessionData.user.email,
          name: sessionData.user.name,
          picture: sessionData.user.picture
        },
        message: 'Acceso autorizado'
      })
    };

  } catch (error) {
    console.error('❌ [Auth Check] Error verificando autenticación:', error);
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
