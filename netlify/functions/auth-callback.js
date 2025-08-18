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
      console.error('[Auth Callback] Error:', error, error_description);
      
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
      console.error('[Auth Callback] No authorization code provided');
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
      console.error('[Auth Callback] Error obteniendo token:', tokenData);
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
      console.error('[Auth Callback] Error obteniendo información del usuario:', userData);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Error obteniendo información del usuario' })
      };
    }
    
    // Obtener URL de destino desde el state
    let redirectUrl = null;
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        redirectUrl = stateData.redirect;
        console.log('[Auth Callback] URL de destino encontrada en state:', redirectUrl);
      } catch (error) {
        console.log('[Auth Callback] State no contiene URL de destino, usando index por defecto');
      }
    }
    
    console.log('[Auth Callback] URL de destino final:', redirectUrl);
    
    // Crear sesión con access_token (necesario para funcionalidad)
    const session = {
      user: {
        sub: userData.sub,
        given_name: userData.given_name,
        family_name: userData.family_name,
        nickname: userData.nickname,
        name: userData.name,
        picture: userData.picture,
        updated_at: userData.updated_at,
        email: userData.email,
        email_verified: userData.email_verified
      },
      access_token: tokenData.access_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    
    // Generar token de sesión seguro
    const crypto = require('crypto');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Crear página HTML que configure localStorage y redirija
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurando sesión...</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 400px;
            width: 90%;
        }
        
        .logo {
            font-size: 2.5rem;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        
        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 30px;
            color: white;
        }
        
        .progress-container {
            margin: 30px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #fff, #f0f0f0);
            border-radius: 3px;
            animation: progress 2s ease-in-out;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        
        .status {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 20px;
        }
        
        .user-info {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 0.85rem;
        }
        
        .user-email {
            font-weight: 600;
            color: #fff;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .container {
            animation: fadeIn 0.5s ease-out;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h2>Configurando tu sesión</h2>
        
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        </div>
        
        <div class="status">Redirigiendo al diagrama...</div>
        
        <div class="user-info">
            <div>Bienvenido, <span class="user-email">${userData.email}</span></div>
        </div>
    </div>
    
    <script>
        // Configurar sesión en localStorage (incluye access_token necesario)
        const sessionData = ${JSON.stringify(session)};
        const sessionToken = '${sessionToken}';
        
        localStorage.setItem('session_data', JSON.stringify(sessionData));
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('session_expires', '${session.expires_at}');
        
        console.log('[Auth Callback] Sesión configurada correctamente');
        
        // Redirigir al diagrama o a la URL guardada
        setTimeout(() => {
            // Usar URL de destino desde el state del servidor
            const redirectUrl = ${redirectUrl ? `'${redirectUrl}'` : 'null'};
            console.log('[Auth Callback] URL de destino desde state:', redirectUrl);
            
            if (redirectUrl && redirectUrl !== 'null') {
                const fullUrl = '${process.env.AUTH0_BASE_URL}' + redirectUrl;
                console.log('[Auth Callback] Redirigiendo a URL de destino:', fullUrl);
                window.location.href = fullUrl;
            } else {
                // Redirigir al index principal
                const indexUrl = '${process.env.AUTH0_BASE_URL}/index.html';
                console.log('[Auth Callback] Redirigiendo al index principal:', indexUrl);
                window.location.href = indexUrl;
            }
        }, 2000);
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
    console.error('[Auth Callback] Error:', error);
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
