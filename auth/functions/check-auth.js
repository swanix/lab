// Función mejorada de verificación de autenticación con localStorage

// Simulación de rate limiting (en producción usar Redis)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 100;

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
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://lab.swanix.org',
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
      console.warn(`[Auth Check] Rate limit excedido - IP: ${clientIP}`);
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

    // Verificar datos de sesión desde el body
    let sessionData, sessionToken;
    
    if (event.httpMethod === 'POST') {
      try {
        const body = JSON.parse(event.body || '{}');
        sessionData = body.sessionData;
        sessionToken = body.sessionToken;
      } catch (error) {
        console.warn(`[Auth Check] Error parseando body - IP: ${clientIP}`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Datos de sesión inválidos',
            code: 'INVALID_SESSION_DATA'
          })
        };
      }
    }
    
    if (!sessionData || !sessionToken) {
      console.warn(`[Auth Check] No hay datos de sesión - IP: ${clientIP}`);
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

    // Validar datos de sesión
    let parsedSession;
    try {
      parsedSession = JSON.parse(sessionData);
    } catch (error) {
      console.warn(`[Auth Check] Error parseando sesión - IP: ${clientIP}`);
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
    if (parsedSession.expires_at && Date.now() > parsedSession.expires_at) {
      console.warn(`[Auth Check] Sesión expirada - IP: ${clientIP}, Email: ${parsedSession.user?.email}`);
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

    // Verificar que el usuario tenga un email válido
    if (!parsedSession.user || !parsedSession.user.email) {
      console.warn(`[Auth Check] Usuario sin email - IP: ${clientIP}`);
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Acceso denegado',
          message: 'Usuario sin email válido',
          code: 'FORBIDDEN'
        })
      };
    }
    
    // Acceso autorizado (Auth0 ya verificó el dominio)
    console.log(`[Auth Check] Acceso autorizado - IP: ${clientIP}, Email: ${parsedSession.user.email}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        user: {
          email: parsedSession.user.email,
          name: parsedSession.user.name,
          picture: parsedSession.user.picture
        },
        message: 'Acceso autorizado'
      })
    };

  } catch (error) {
    console.error('[Auth Check] Error verificando autenticación:', error);
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
