// Función mejorada de verificación de autenticación con cookies

const SessionManager = require('./session-manager');

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

    // 🔐 Verificar sesión usando cookies
    const sessionValidation = SessionManager.validateSession(event);
    
    if (!sessionValidation.valid) {
      console.warn(`🚨 [Auth Check] Sesión inválida - IP: ${clientIP}, Error: ${sessionValidation.error}`);
      return {
        statusCode: sessionValidation.code === 'FORBIDDEN' ? 403 : 401,
        headers,
        body: JSON.stringify({
          error: sessionValidation.error,
          message: sessionValidation.error,
          code: sessionValidation.code
        })
      };
    }

    // ✅ Sesión válida - obtener información del usuario desde cookies
    const cookies = SessionManager.parseCookies(event);
    
    // En una implementación real, aquí obtendrías los datos del usuario desde una base de datos
    // usando el sessionToken. Por ahora, simulamos un usuario autorizado
    const userData = {
      email: 'usuario@gmail.com', // Esto vendría de la base de datos
      name: 'Usuario Autorizado',
      picture: 'https://example.com/avatar.jpg'
    };

    // Verificar que el usuario tenga un email de Google
    if (!userData.email || !userData.email.endsWith('@gmail.com')) {
      console.warn(`🚨 [Auth Check] Intento de acceso con email no autorizado - IP: ${clientIP}, Email: ${userData.email}`);
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
    console.log(`✅ [Auth Check] Acceso autorizado - IP: ${clientIP}, Email: ${userData.email}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        user: userData,
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
