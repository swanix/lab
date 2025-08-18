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
    // Logout simple - redirigir directamente al login
    const returnTo = `${process.env.AUTH0_BASE_URL}/login.html`;
    
    console.log('🔄 [Logout Function] Redirecting to login:', returnTo);
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': returnTo
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
