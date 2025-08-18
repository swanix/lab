// Verificar autenticación usando localStorage
async function checkAuthentication() {
  try {
    console.log('[Auth] Iniciando verificación de autenticación...');
    console.log('[Auth] URL actual:', window.location.pathname + window.location.search);
    
    // Verificar si hay datos de sesión en localStorage
    const sessionData = localStorage.getItem('session_data');
    const sessionToken = localStorage.getItem('session_token');
    const sessionExpires = localStorage.getItem('session_expires');
    
    console.log('[Auth] Datos de sesión encontrados:', {
      sessionData: !!sessionData,
      sessionToken: !!sessionToken,
      sessionExpires: !!sessionExpires
    });
    
    if (!sessionData || !sessionToken || !sessionExpires) {
      console.log('[Auth] No hay datos de sesión, redirigiendo a login con URL de destino');
      // Guardar URL actual como parámetro en lugar de localStorage
      const currentUrl = window.location.pathname + window.location.search;
      console.log('[Auth] URL a guardar:', currentUrl);
      if (currentUrl !== '/') {
        const loginUrl = `/login.html?redirect=${encodeURIComponent(currentUrl)}`;
        console.log('[Auth] ✅ Redirigiendo a login con URL de destino:', loginUrl);
        window.location.href = loginUrl;
      } else {
        console.log('[Auth] ⚠️ Redirigiendo a login sin URL de destino');
        window.location.href = '/login.html';
      }
      return;
    }
    
    // Verificar si la sesión ha expirado
    const now = Date.now();
    const expiresAt = parseInt(sessionExpires);
    
    if (now > expiresAt) {
      console.log('[Auth] Sesión expirada, redirigiendo a login con URL de destino');
      // Guardar URL actual como parámetro en lugar de localStorage
      const currentUrl = window.location.pathname + window.location.search;
      console.log('[Auth] URL a guardar:', currentUrl);
      if (currentUrl !== '/') {
        const loginUrl = `/login.html?redirect=${encodeURIComponent(currentUrl)}`;
        console.log('[Auth] ✅ Redirigiendo a login con URL de destino:', loginUrl);
        window.location.href = loginUrl;
      } else {
        console.log('[Auth] ⚠️ Redirigiendo a login sin URL de destino');
        window.location.href = '/login.html';
      }
      localStorage.removeItem('session_data');
      localStorage.removeItem('session_token');
      localStorage.removeItem('session_expires');
      return;
    }
    
    // Verificar autenticación con el servidor
    const authPromise = fetch('/.netlify/functions/check-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionData: sessionData,
        sessionToken: sessionToken
      })
    });
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const response = await Promise.race([authPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.authenticated) {
      console.log('[Auth] Usuario no autenticado, redirigiendo a login con URL de destino');
      // Guardar URL actual como parámetro en lugar de localStorage
      const currentUrl = window.location.pathname + window.location.search;
      console.log('[Auth] URL a guardar:', currentUrl);
      if (currentUrl !== '/') {
        const loginUrl = `/login.html?redirect=${encodeURIComponent(currentUrl)}`;
        console.log('[Auth] ✅ Redirigiendo a login con URL de destino:', loginUrl);
        window.location.href = loginUrl;
      } else {
        console.log('[Auth] ⚠️ Redirigiendo a login sin URL de destino');
        window.location.href = '/login.html';
      }
      localStorage.removeItem('session_data');
      localStorage.removeItem('session_token');
      localStorage.removeItem('session_expires');
      return;
    }
    
    console.log('[Auth] Usuario autenticado:', data.user.email);
    
  } catch (error) {
    console.error('[Auth] Error verificando autenticación:', error);
    // Guardar URL actual como parámetro en lugar de localStorage
    const currentUrl = window.location.pathname + window.location.search;
    console.log('[Auth] URL a guardar:', currentUrl);
    if (currentUrl !== '/') {
      const loginUrl = `/login.html?redirect=${encodeURIComponent(currentUrl)}`;
      console.log('[Auth] ✅ Redirigiendo a login con URL de destino:', loginUrl);
      window.location.href = loginUrl;
    } else {
      console.log('[Auth] ⚠️ Redirigiendo a login sin URL de destino');
      window.location.href = '/login.html';
    }
    // Limpiar datos de sesión en caso de error
    localStorage.removeItem('session_data');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_expires');
  }
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
        window.location.href = '/login.html';
      }
    });
  }
}

// Inicializar autenticación
checkAuthentication();
