// ===== SISTEMA DE AUTENTICACIÓN MODULAR =====
// Este archivo proporciona funcionalidad de autenticación plug & play
// Requiere que auth-config.js esté cargado antes

// Verificar que la configuración esté disponible
if (typeof window.AUTH_CONFIG === 'undefined') {
  console.error('[Auth] Error: AUTH_CONFIG no está definido. Asegúrate de cargar auth-config.js antes que auth.js');
}

// ===== FUNCIÓN DE VERIFICACIÓN DE SESIÓN =====
async function checkAuthentication() {
  authLog('🔍 INICIANDO VERIFICACIÓN DE AUTENTICACIÓN');
  authLog('URL actual:', window.location.href);
  
  try {
    authLog('Verificando autenticación...');
    
    // Verificar si hay datos de sesión
    const sessionData = localStorage.getItem(getAuthConfig('storage.sessionDataKey'));
    const sessionToken = localStorage.getItem(getAuthConfig('storage.sessionTokenKey'));
    const sessionExpires = localStorage.getItem(getAuthConfig('storage.sessionExpiresKey'));
    
    authLog('Datos de sesión encontrados:', {
      sessionData: !!sessionData,
      sessionToken: !!sessionToken,
      sessionExpires: sessionExpires
    });
    
    if (!sessionData || !sessionToken || !sessionExpires) {
      authLog('No hay datos de sesión');
      redirectToLogin();
      return;
    }
    
    // Verificar si la sesión ha expirado
    const now = Date.now();
    const expiresAt = parseInt(sessionExpires);
    
    authLog('Verificando expiración:', {
      now: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      isExpired: now >= expiresAt
    });
    
    if (now >= expiresAt) {
      authLog('Sesión expirada');
      clearSession();
      redirectToLogin();
      return;
    }
    
    // Parsear datos de sesión
    const session = JSON.parse(sessionData);
    authLog('Sesión parseada:', {
      userEmail: session.user?.email,
      expiresAt: session.expires_at
    });
    
    // Verificar que el token de sesión sea válido
    authLog('Llamando a check-auth...');
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
    
    authLog('Respuesta de check-auth:', {
      status: response.status,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.error('[Auth] Error verificando sesión:', response.status);
      const errorText = await response.text();
      console.error('[Auth] Error details:', errorText);
      clearSession();
      redirectToLogin();
      return;
    }
    
    const result = await response.json();
    authLog('Resultado de verificación:', result);
    
    if (!result.authenticated) {
      console.error('[Auth] Sesión inválida');
      clearSession();
      redirectToLogin();
      return;
    }
    
    // Si llegamos aquí, Auth0 ya verificó el dominio y email
    authLog('✅ Autenticación exitosa');
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
  authLog('Sesión limpiada');
}

// ===== FUNCIÓN PARA REDIRIGIR AL LOGIN =====
function redirectToLogin() {
  const currentUrl = window.location.pathname + window.location.search;
  // Redirigir al landing público en lugar de directamente al login
  const landingUrl = currentUrl.startsWith('/app/') 
    ? `/?redirect=${encodeURIComponent(currentUrl)}`
    : `${getAuthConfig('pages.login')}?redirect=${encodeURIComponent(currentUrl)}`;
  authLog('Redirigiendo a login:', landingUrl);
  window.location.href = landingUrl;
}

// ===== FUNCIÓN PARA REDIRIGIR A FORBIDDEN =====
function redirectToForbidden(reason = '') {
  const forbiddenUrl = reason 
    ? `${getAuthConfig('pages.forbidden')}?reason=${encodeURIComponent(reason)}`
    : getAuthConfig('pages.forbidden');
  authLog('Redirigiendo a forbidden:', forbiddenUrl);
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
