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
    const { code, state, error, error_description } = event.queryStringParameters || {};
    
    if (error) {
      console.error('❌ [Auth Callback] Auth0 error:', error, error_description);
      
      // Si el error es "login_required", redirigir al login con autenticación completa
      if (error === 'login_required') {
        const auth0Domain = process.env.AUTH0_DOMAIN;
        const clientId = process.env.AUTH0_CLIENT_ID;
        const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
        
        // Detectar theme del usuario
        const userAgent = event.headers['user-agent'] || '';
        const prefersDark = userAgent.includes('dark') || 
                           (event.queryStringParameters && event.queryStringParameters.theme === 'dark');
        
        // Redirigir directamente a Google con selección de cuenta y theme
        const authUrl = `https://${auth0Domain}/authorize?` +
          `response_type=code&` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=openid%20profile%20email&` +
          `connection=google-oauth2&` +
          `prompt=select_account&` +
          `state=${Math.random().toString(36).substring(7)}&` +
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
      
      // Si el error es "access_denied", redirigir a la página de forbidden
      if (error === 'access_denied') {
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
      
      // Para otros errores, redirigir al login
      const loginUrl = `${process.env.AUTH0_BASE_URL}/login.html?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description)}`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': loginUrl
        },
        body: ''
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
    
    // Crear sesión
    const session = {
      user: userData,
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    
    // Generar token de sesión seguro
    const crypto = require('crypto');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Crear página HTML que configure localStorage y redirija
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Configurando sesión...</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5; 
        }
        .loader { 
            border: 4px solid #f3f3f3; 
            border-top: 4px solid #3498db; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 20px auto; 
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
    </style>
</head>
<body>
    <h2>Configurando tu sesión...</h2>
    <div class="loader"></div>
    <p>Redirigiendo al diagrama...</p>
    
    <script>
        // Configurar sesión en localStorage
        const sessionData = ${JSON.stringify(session)};
        const sessionToken = '${sessionToken}';
        
        localStorage.setItem('session_data', JSON.stringify(sessionData));
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('session_expires', '${session.expires_at}');
        
        // Redirigir al diagrama
        setTimeout(() => {
            window.location.href = '${process.env.AUTH0_BASE_URL}/index.html';
        }, 1000);
    </script>
</body>
</html>`;
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/html'
      },
      body: html
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
