const { handleAuth } = require('@auth0/nextjs-auth0');

// Configurar Auth0 con las variables de entorno correctas
const config = {
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  }
};

exports.handler = handleAuth(config);
