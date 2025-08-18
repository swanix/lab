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
    const { action } = event.queryStringParameters || {};
    
    if (action === 'login') {
      // Redirigir a Auth0 para login
      const auth0Domain = process.env.AUTH0_DOMAIN;
      const clientId = process.env.AUTH0_CLIENT_ID;
      const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
      
      // Detectar theme del usuario desde headers o parámetros
      const userAgent = event.headers['user-agent'] || '';
      const prefersDark = userAgent.includes('dark') || 
                         (event.queryStringParameters && event.queryStringParameters.theme === 'dark');
      
      // Obtener URL de destino
      const redirectUrl = event.queryStringParameters && event.queryStringParameters.redirect;
      
      // Construir state con URL de destino si existe
      const state = redirectUrl ? 
        JSON.stringify({ redirect: redirectUrl }) : 
        Math.random().toString(36).substring(7);
      
      // Redirigir directamente a Google con selección de cuenta y theme
      const authUrl = `https://${auth0Domain}/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid%20profile%20email&` +
        `connection=google-oauth2&` +
        `prompt=select_account&` +
        `state=${encodeURIComponent(state)}&` +
        `ui_locales=${prefersDark ? 'dark' : 'light'}`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': authUrl
        },
        body: ''
      };
    }
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Acción no válida' })
    };

  } catch (error) {
    console.error('[Auth] Error:', error);
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
