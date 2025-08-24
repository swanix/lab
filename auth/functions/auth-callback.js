exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://lab.swanix.org',
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
        const forbiddenUrl = `${process.env.AUTH0_BASE_URL}/forbidden?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description)}`;
        
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
      const loginUrl = `${process.env.AUTH0_BASE_URL}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description)}`;
      
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
    
    // Verificar que el usuario tenga un email de Google autorizado
    if (!userData.email || !userData.email.endsWith('@gmail.com')) {
      console.error('[Auth Callback] Intento de acceso con email no autorizado:', userData.email);
      
      // Redirigir a la página de forbidden
      const forbiddenUrl = `${process.env.AUTH0_BASE_URL}/forbidden?error=access_denied&error_description=${encodeURIComponent('Solo se permiten cuentas de Google (@gmail.com)')}`;
      
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': forbiddenUrl
        },
        body: ''
      };
    }
    
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
    <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
    <link rel="stylesheet" href="/assets/app.css">
    <style>
        /* Estilos específicos para el callback en dark mode */
        body {
            background: #0f0f0f !important;
            color: #ffffff !important;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .callback-container {
            background: #1f1f1f;
            border: 1px solid #404040;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
        }
        
        .logo {
            margin-bottom: 1.5rem;
        }
        
        .logo-img {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background: #2a2a2a;
            padding: 8px;
        }
        
        h2 {
            color: #ffffff;
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .progress-container {
            margin: 1.5rem 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background: #404040;
            border-radius: 2px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: #3b82f6;
            border-radius: 2px;
            animation: progress 2s ease-in-out infinite;
        }
        
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
        }
        
        .status {
            color: #e5e5e5;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
        }
        
        .user-info {
            background: #2a2a2a;
            border: 1px solid #525252;
            padding: 1rem;
            border-radius: 8px;
            color: #e5e5e5;
            font-size: 0.9rem;
        }
        
        .user-email {
            color: #3b82f6;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="callback-container">
        <div class="logo">
            <img src="/assets/favicon.svg" alt="Logo" class="logo-img">
        </div>
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
        // Configurar sesión en localStorage
        const sessionData = ${JSON.stringify(session)};
        const sessionToken = '${sessionToken}';
        
        localStorage.setItem('session_data', JSON.stringify(sessionData));
        localStorage.setItem('session_token', sessionToken);
        localStorage.setItem('session_expires', '${session.expires_at}');
        
        console.log('[Auth Callback] Sesión configurada correctamente');
        
        // Verificar que los datos se guardaron correctamente
        const savedSessionData = localStorage.getItem('session_data');
        const savedSessionToken = localStorage.getItem('session_token');
        const savedSessionExpires = localStorage.getItem('session_expires');
        
        console.log('[Auth Callback] Verificación de datos guardados:', {
            sessionData: !!savedSessionData,
            sessionToken: !!savedSessionToken,
            sessionExpires: savedSessionExpires
        });
        
        if (!savedSessionData || !savedSessionToken || !savedSessionExpires) {
            console.error('[Auth Callback] ❌ Error: Los datos no se guardaron correctamente');
            alert('Error configurando la sesión. Intenta nuevamente.');
        } else {
            console.log('[Auth Callback] ✅ Datos guardados correctamente, procediendo con redirección...');
            
            // Redirigir al diagrama o a la URL guardada
            setTimeout(() => {
                // Usar URL de destino desde el state del servidor
                const redirectUrl = ${redirectUrl ? `'${redirectUrl}'` : 'null'};
                console.log('[Auth Callback] URL de destino desde state:', redirectUrl);
                
                if (redirectUrl && redirectUrl !== 'null') {
                    // Construir URL completa correctamente
                    const baseUrl = '${process.env.AUTH0_BASE_URL}';
                    const fullUrl = redirectUrl.startsWith('/') ? 
                        baseUrl + redirectUrl : 
                        baseUrl + '/' + redirectUrl;
                    console.log('[Auth Callback] Redirigiendo a URL de destino:', fullUrl);
                    window.location.href = fullUrl;
                } else {
                    // Redirigir al dashboard de aplicaciones
                    const dashboardUrl = '${process.env.AUTH0_BASE_URL}/app/';
                    console.log('[Auth Callback] Redirigiendo al dashboard de aplicaciones:', dashboardUrl);
                    window.location.href = dashboardUrl;
                }
            }, 3000); // Aumentado de 2000 a 3000ms
        }
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
