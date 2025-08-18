// Función simplificada de verificación de autenticación

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
    // Obtener sesión desde query parameters
    const { session } = event.queryStringParameters || {};
    
    if (!session) {
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
