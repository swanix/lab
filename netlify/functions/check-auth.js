const { getSession } = require('@auth0/nextjs-auth0');

exports.handler = async (event, context) => {
  console.log('🔐 [Auth Check] Verificando autenticación...');
  
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
    // Obtener la sesión del usuario
    const session = await getSession(event, context);
    
    console.log('🔍 [Auth Check] Estado de sesión:', {
      isAuthenticated: !!session?.user,
      userEmail: session?.user?.email,
      userSub: session?.user?.sub
    });

    if (!session || !session.user) {
      console.log('❌ [Auth Check] Usuario no autenticado');
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

    // Verificar que el usuario tenga un email de Google
    if (!session.user.email || !session.user.email.endsWith('@gmail.com')) {
      console.log('❌ [Auth Check] Email no válido:', session.user.email);
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

    console.log('✅ [Auth Check] Usuario autenticado correctamente');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        user: {
          email: session.user.email,
          name: session.user.name,
          picture: session.user.picture
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
