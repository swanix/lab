// Función de logout que limpia cookies de sesión

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
    console.log('🚪 [Logout] Procesando logout del usuario');

    // Configurar cookies para limpiar la sesión
    const clearCookieOptions = [
      'session_token=',
      'session_hash=',
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Max-Age=0',
      'Expires=Thu, 01 Jan 1970 00:00:01 GMT'
    ];

    // Redirigir al login con cookies limpias
    const loginUrl = `${process.env.AUTH0_BASE_URL}/login.html`;
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': loginUrl,
        'Set-Cookie': clearCookieOptions.join('; ')
      },
      body: ''
    };

  } catch (error) {
    console.error('❌ [Logout] Error:', error);
    
    // En caso de error, redirigir al login de todas formas
    const loginUrl = `${process.env.AUTH0_BASE_URL}/login.html`;
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': loginUrl
      },
      body: ''
    };
  }
};
