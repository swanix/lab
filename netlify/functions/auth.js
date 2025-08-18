const { ManagementClient } = require('auth0');

exports.handler = async (event, context) => {
  console.log('🚀 [Auth Function] Function invoked');
  console.log('📋 [Auth Function] Event details:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers
  });
  
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
      
      console.log('🔍 [Auth] Configuración:', {
        auth0Domain,
        clientId,
        redirectUri,
        baseUrl: process.env.AUTH0_BASE_URL
      });
      
      // Usar prompt=none solo si el usuario ya está autenticado
      // Si no está autenticado, Auth0 mostrará la pantalla de login
      const authUrl = `https://${auth0Domain}/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=openid%20profile%20email&` +
        `state=${Math.random().toString(36).substring(7)}`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': authUrl
        },
        body: ''
      };
    }
    
    if (action === 'callback' || event.path.includes('/callback')) {
      // Manejar callback de Auth0
      console.log('🔄 [Auth Function] Processing callback');
      const { code, state, error, error_description } = event.queryStringParameters || {};
      
      if (error) {
        console.error('❌ [Auth Function] Auth0 error:', error, error_description);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error, error_description })
        };
      }
      
      if (!code) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Código de autorización no proporcionado' })
        };
      }
      
      // Intercambiar código por token
      const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          code: code,
          redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('❌ [Auth] Error obteniendo token:', tokenData);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Error en autenticación' })
        };
      }
      
      // Obtener información del usuario
      const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      const userData = await userResponse.json();
      
      // Crear sesión simple (en producción usarías cookies seguras)
      const session = {
        user: userData,
        access_token: tokenData.access_token,
        expires_at: Date.now() + (tokenData.expires_in * 1000)
      };
      
      // Redirigir al diagrama con sesión
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': `${process.env.AUTH0_BASE_URL}/index.html?session=${encodeURIComponent(JSON.stringify(session))}`
        },
        body: ''
      };
    }
    
    if (action === 'logout') {
      // Logout simple
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': `${process.env.AUTH0_BASE_URL}/login.html`
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
    console.error('❌ [Auth] Error:', error);
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
