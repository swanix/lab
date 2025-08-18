exports.handler = async (event, context) => {
  console.log('🔄 [Auth Callback] Function invoked');
  console.log('📋 [Auth Callback] Event details:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters
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
    const { code, state, error, error_description } = event.queryStringParameters || {};
    
    if (error) {
      console.error('❌ [Auth Callback] Auth0 error:', error, error_description);
      
      // Si el error es "login_required", redirigir al login
      if (error === 'login_required') {
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
        body: JSON.stringify({ error, error_description })
      };
    }
    
    if (!code) {
      console.error('❌ [Auth Callback] No authorization code provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Código de autorización no proporcionado' })
      };
    }
    
    console.log('✅ [Auth Callback] Authorization code received:', code);
    
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
      console.error('❌ [Auth Callback] Error obteniendo token:', tokenData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Error en autenticación', details: tokenData })
      };
    }
    
    console.log('✅ [Auth Callback] Token obtained successfully');
    
    // Obtener información del usuario
    const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('❌ [Auth Callback] Error obteniendo información del usuario:', userData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Error obteniendo información del usuario' })
      };
    }
    
    console.log('✅ [Auth Callback] User info obtained:', userData.email);
    
    // Crear sesión
    const session = {
      user: userData,
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    
    // Redirigir al diagrama con sesión
    const redirectUrl = `${process.env.AUTH0_BASE_URL}/index.html?session=${encodeURIComponent(JSON.stringify(session))}`;
    
    console.log('🔄 [Auth Callback] Redirecting to:', redirectUrl);
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': redirectUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('❌ [Auth Callback] Error:', error);
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
