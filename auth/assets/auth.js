// ===== SISTEMA DE AUTENTICACIÓN MODULAR =====
// Este archivo proporciona funcionalidad de autenticación plug & play
// Requiere que auth-config.js esté cargado antes

// Verificar que la configuración esté disponible
if (typeof window.AUTH_CONFIG === 'undefined') {
  console.error('[Auth] Error: AUTH_CONFIG no está definido. Asegúrate de cargar auth-config.js antes que auth.js');
}

// ===== FUNCIÓN DE VERIFICACIÓN DE SESIÓN =====
async function checkAuthentication() {
  try {
    // Verificar si hay datos de sesión
    const sessionData = localStorage.getItem(getAuthConfig('storage.sessionDataKey'));
    const sessionToken = localStorage.getItem(getAuthConfig('storage.sessionTokenKey'));
    const sessionExpires = localStorage.getItem(getAuthConfig('storage.sessionExpiresKey'));
    
    if (!sessionData || !sessionToken || !sessionExpires) {
      redirectToLogin();
      return;
    }
    
    // Verificar si la sesión ha expirado
    const now = Date.now();
    const expiresAt = parseInt(sessionExpires);
    
    if (now >= expiresAt) {
      clearSession();
      redirectToLogin();
      return;
    }
    
    // Parsear datos de sesión
    const session = JSON.parse(sessionData);
    
    // Verificar que el token de sesión sea válido
    const response = await fetch(getAuthConfig('endpoints.checkAuth'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        sessionData: sessionData,
        sessionToken: sessionToken
      })
    });
    
    if (!response.ok) {
      console.error('[Auth] Error verificando sesión:', response.status);
      clearSession();
      redirectToLogin();
      return;
    }
    
    const result = await response.json();
    
    if (!result.authenticated) {
      console.error('[Auth] Sesión inválida');
      clearSession();
      redirectToLogin();
      return;
    }
    
    return session;
    
  } catch (error) {
    console.error('[Auth] Error en verificación:', error);
    clearSession();
    redirectToLogin();
  }
}

// ===== FUNCIÓN PARA LIMPIAR SESIÓN =====
function clearSession() {
  localStorage.removeItem(getAuthConfig('storage.sessionDataKey'));
  localStorage.removeItem(getAuthConfig('storage.sessionTokenKey'));
  localStorage.removeItem(getAuthConfig('storage.sessionExpiresKey'));
}

// ===== FUNCIÓN PARA REDIRIGIR AL LOGIN =====
function redirectToLogin() {
  const currentUrl = window.location.pathname + window.location.search;
  // Redirigir al landing público en lugar de directamente al login
  const landingUrl = currentUrl.startsWith('/app/') 
    ? `/?redirect=${encodeURIComponent(currentUrl)}`
    : `${getAuthConfig('pages.login')}?redirect=${encodeURIComponent(currentUrl)}`;
  window.location.href = landingUrl;
}

// ===== FUNCIÓN PARA REDIRIGIR A FORBIDDEN =====
function redirectToForbidden(reason = '') {
  const forbiddenUrl = reason 
    ? `${getAuthConfig('pages.forbidden')}?reason=${encodeURIComponent(reason)}`
    : getAuthConfig('pages.forbidden');
  window.location.href = forbiddenUrl;
}

// ===== CONFIGURAR BOTÓN DE LOGOUT =====
function setupLogout() {
  const logoutContainer = document.getElementById('logout-container');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutContainer && logoutBtn) {
    logoutContainer.style.display = 'block';
    
    logoutBtn.addEventListener('click', async () => {
      try {
        // Limpiar datos de sesión
        clearSession();
        
        // Limpiar sessionStorage también
        sessionStorage.clear();
        
        // Redirigir a logout del servidor
        window.location.href = getAuthConfig('endpoints.logout');
      } catch (error) {
        console.error('[Auth] Error en logout:', error);
        // Redirigir al landing principal en caso de error
        window.location.href = '/';
      }
    });
  }
}

// ===== FUNCIÓN PARA VERIFICAR DOMINIO PERMITIDO =====
function isAllowedDomain(email) {
  const allowedDomains = getAuthConfig('app.allowedDomains');
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
}

// ===== FUNCIÓN PARA OBTENER DATOS DE USUARIO =====
function getUserData() {
  const sessionData = localStorage.getItem(getAuthConfig('storage.sessionDataKey'));
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('[Auth] Error parseando datos de usuario:', error);
      return null;
    }
  }
  return null;
}

// ===== FUNCIÓN PARA VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO =====
function isAuthenticated() {
  const sessionData = localStorage.getItem(getAuthConfig('storage.sessionDataKey'));
  const sessionToken = localStorage.getItem(getAuthConfig('storage.sessionTokenKey'));
  const sessionExpires = localStorage.getItem(getAuthConfig('storage.sessionExpiresKey'));
  
  if (!sessionData || !sessionToken || !sessionExpires) {
    return false;
  }
  
  const now = Date.now();
  const expiresAt = parseInt(sessionExpires);
  
  return now < expiresAt;
}

// ===== FUNCIÓN PARA ACCEDER A DATOS PROTEGIDOS VÍA PROXY =====
async function fetchProtectedData(url, options = {}) {
  // Verificar que el proxy esté habilitado
  if (!getAuthConfig('apiProxy.enabled')) {
    throw new Error('API Proxy no está habilitado. Configura apiProxy.enabled = true en auth-config.js');
  }
  
  // Verificar que el usuario esté autenticado
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }
  
  // Verificar que la URL esté en los dominios permitidos
  const allowedDomains = getAuthConfig('apiProxy.allowedDomains');
  const isAllowed = allowedDomains.some(domain => url.includes(domain));
  
  if (!isAllowed) {
    throw new Error(`URL no permitida. Dominios permitidos: ${allowedDomains.join(', ')}`);
  }
  
  // Construir URL del proxy
  const proxyUrl = `${getAuthConfig('apiProxy.endpoint')}?url=${encodeURIComponent(url)}`;
  
  // Realizar petición al proxy
  const response = await fetch(proxyUrl, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en proxy de API');
  }
  
  return response.json();
}

// ===== EXPORTAR FUNCIONES PARA USO GLOBAL =====
window.Auth = {
  checkAuthentication,
  clearSession,
  redirectToLogin,
  redirectToForbidden,
  setupLogout,
  isAllowedDomain,
  getUserData,
  isAuthenticated,
  fetchProtectedData
};

// ===== INICIALIZACIÓN AUTOMÁTICA =====
// Solo inicializar si no estamos en una página de auth
const currentPath = window.location.pathname;
const isAuthPage = currentPath.includes('/auth/') || 
                   currentPath.includes('/login') || 
                   currentPath.includes('/forbidden');

if (!isAuthPage) {
  // Inicializar autenticación automáticamente
  checkAuthentication();
}
