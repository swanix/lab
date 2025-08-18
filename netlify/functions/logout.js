// Función de logout simplificada

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
    console.log('[Logout] Procesando logout del usuario');

    // Redirigir al login (los datos de sesión se limpian en el frontend)
    const loginUrl = `${process.env.AUTH0_BASE_URL}/login.html`;
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': loginUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('[Logout] Error:', error);
    
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
