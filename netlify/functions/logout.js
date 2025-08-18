exports.handler = async (event, context) => {
  console.log('🚪 [Logout Function] Function invoked');
  
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
    // Construir URL de logout de Auth0
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const returnTo = `${process.env.AUTH0_BASE_URL}/login.html`;
    
    const logoutUrl = `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}`;
    
    console.log('🔄 [Logout Function] Redirecting to Auth0 logout:', logoutUrl);
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': logoutUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('❌ [Logout Function] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};
