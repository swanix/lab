// ===== CONFIGURACIÓN CENTRALIZADA DE AUTENTICACIÓN =====
// Este archivo permite personalizar fácilmente la configuración de auth
// para diferentes proyectos sin modificar el código principal

window.AUTH_CONFIG = {
  // Rutas de la API de autenticación
  endpoints: {
    login: '/api/auth/login',
    callback: '/api/auth/callback',
    logout: '/api/logout',
    checkAuth: '/.netlify/functions/check-auth'
  },
  
  // Proxy de API opcional (para acceso a datos protegidos)
  apiProxy: {
    enabled: false, // Cambiar a true para habilitar
    endpoint: '/api/proxy',
    serviceName: 'SheetBest', // Nombre del servicio
    allowedDomains: ['api.sheetbest.com'] // Dominios permitidos
  },
  
  // Rutas de las páginas
  pages: {
    login: '/login',
    forbidden: '/forbidden'
  },
  
  // Configuración de la aplicación
  app: {
    name: 'Diagrama Interactivo',
    logo: '/assets/img/favicon.svg',
    allowedDomains: ['gmail.com'], // Dominios permitidos
    redirectAfterLogin: '/' // Página por defecto después del login
  },
  
  // Configuración de almacenamiento
  storage: {
    sessionDataKey: 'session_data',
    sessionTokenKey: 'session_token',
    sessionExpiresKey: 'session_expires'
  },
  
  // Configuración de debug
  debug: {
    enabled: true, // Cambiar a false en producción
    prefix: '[Auth]'
  }
};

// Función helper para obtener configuración
function getAuthConfig(key) {
  return key.split('.').reduce((obj, k) => obj && obj[k], window.AUTH_CONFIG);
}

// Función helper para logging
function authLog(message, ...args) {
  if (getAuthConfig('debug.enabled')) {
    console.log(`${getAuthConfig('debug.prefix')} ${message}`, ...args);
  }
}
