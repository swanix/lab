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
      } catch (error) {
        // State no contiene URL de destino, usar index por defecto
      }
    }
    
    // Verificar que el usuario tenga un email de Google autorizado
    if (!userData.email || !userData.email.endsWith('@gmail.com')) {
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
    
    // Redirigir a la página de callback con los datos necesarios
    const callbackUrl = `${process.env.AUTH0_BASE_URL}/auth/pages/callback.html?` +
      `sessionData=${encodeURIComponent(JSON.stringify(session))}&` +
      `sessionToken=${encodeURIComponent(sessionToken)}&` +
      `expiresAt=${encodeURIComponent(session.expires_at)}&` +
      `userEmail=${encodeURIComponent(userData.email)}&` +
      `redirectUrl=${encodeURIComponent(redirectUrl || '')}&` +
      `baseUrl=${encodeURIComponent(process.env.AUTH0_BASE_URL)}`;
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': callbackUrl
      },
      body: ''
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
