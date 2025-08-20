// ===== FUNCIÓN DE VERIFICACIÓN DE SESIÓN =====
async function checkAuthentication() {
  try {
    console.log('[Auth] Verificando autenticación...');
    
    // Verificar si hay datos de sesión
    const sessionData = localStorage.getItem('session_data');
    const sessionToken = localStorage.getItem('session_token');
    const sessionExpires = localStorage.getItem('session_expires');
    
    if (!sessionData || !sessionToken || !sessionExpires) {
      console.log('[Auth] No hay datos de sesión');
      redirectToLogin();
      return;
    }
    
    // Verificar si la sesión ha expirado
    const now = Date.now();
    const expiresAt = parseInt(sessionExpires);
    
    if (now >= expiresAt) {
      console.log('[Auth] Sesión expirada');
      clearSession();
      redirectToLogin();
      return;
    }
    
    // Parsear datos de sesión
    const session = JSON.parse(sessionData);
    
    // Verificar que el token de sesión sea válido
    const response = await fetch('/api/auth/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        session_data: sessionData
      })
    });
    
    if (!response.ok) {
      console.error('[Auth] Error verificando sesión:', response.status);
      clearSession();
      redirectToLogin();
      return;
    }
    
    const result = await response.json();
    
    if (!result.valid) {
      console.error('[Auth] Sesión inválida');
      clearSession();
      redirectToLogin();
      return;
    }
    
    // Si llegamos aquí, Auth0 ya verificó el dominio y email
    console.log('[Auth] ✅ Autenticación exitosa');
    return session;
    
  } catch (error) {
    console.error('[Auth] Error en verificación:', error);
    clearSession();
    redirectToLogin();
  }
}

// ===== FUNCIÓN PARA LIMPIAR SESIÓN =====
function clearSession() {
  localStorage.removeItem('session_data');
  localStorage.removeItem('session_token');
  localStorage.removeItem('session_expires');
  console.log('[Auth] Sesión limpiada');
}

// ===== FUNCIÓN PARA REDIRIGIR AL LOGIN =====
function redirectToLogin() {
  const currentUrl = window.location.pathname + window.location.search;
  const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
  console.log('[Auth] Redirigiendo a login:', loginUrl);
  window.location.href = loginUrl;
}

// Configurar botón de logout
function setupLogout() {
  const logoutContainer = document.getElementById('logout-container');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutContainer && logoutBtn) {
    logoutContainer.style.display = 'block';
    
    logoutBtn.addEventListener('click', async () => {
      try {
        // Limpiar datos de sesión
        localStorage.removeItem('session_data');
        localStorage.removeItem('session_token');
        localStorage.removeItem('session_expires');
        
        // Limpiar sessionStorage también
        sessionStorage.clear();
        
        // Redirigir a logout del servidor
        window.location.href = '/api/logout';
      } catch (error) {
        console.error('[Auth] Error en logout:', error);
        // Redirigir de todas formas
        window.location.href = '/login';
      }
    });
  }
}

// Inicializar autenticación
checkAuthentication();
