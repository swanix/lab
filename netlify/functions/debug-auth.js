exports.handler = async (event, context) => {
  console.log('🔍 [Debug Auth] Function invoked');
  console.log('🔍 [Debug Auth] Full event:', JSON.stringify(event, null, 2));
  console.log('🔍 [Debug Auth] Query parameters:', event.queryStringParameters);
  console.log('🔍 [Debug Auth] Headers:', event.headers);
  console.log('🔍 [Debug Auth] Path:', event.path);
  console.log('🔍 [Debug Auth] HTTP Method:', event.httpMethod);
  
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
    const { code, state, error, error_description } = event.queryStringParameters || {};
    
    console.log('🔍 [Debug Auth] Parsed parameters:');
    console.log('  - code:', code ? 'Presente' : 'Ausente');
    console.log('  - state:', state ? 'Presente' : 'Ausente');
    console.log('  - error:', error);
    console.log('  - error_description:', error_description);
    
    // Si hay un error, redirigir a forbidden.html
    if (error) {
      console.log('❌ [Debug Auth] Error detected, redirecting to forbidden.html');
      const forbiddenUrl = `${process.env.AUTH0_BASE_URL}/forbidden.html?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description)}`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': forbiddenUrl
        },
        body: ''
      };
    }
    
    // Si hay código, procesar normalmente
    if (code) {
      console.log('✅ [Debug Auth] Code present, redirecting to auth-callback');
      const callbackUrl = `${process.env.AUTH0_BASE_URL}/.netlify/functions/auth-callback?${new URLSearchParams(event.queryStringParameters).toString()}`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': callbackUrl
        },
        body: ''
      };
    }
    
    // Si no hay código ni error, mostrar información de debug
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Debug Auth Function',
        timestamp: new Date().toISOString(),
        parameters: event.queryStringParameters,
        path: event.path,
        method: event.httpMethod
      })
    };

  } catch (error) {
    console.error('❌ [Debug Auth] Error:', error);
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
