// Verificar autenticación usando localStorage
async function checkAuthentication() {
  try {
    // Verificar si hay datos de sesión en localStorage
    const sessionData = localStorage.getItem('session_data');
    const sessionToken = localStorage.getItem('session_token');
    const sessionExpires = localStorage.getItem('session_expires');
    
    if (!sessionData || !sessionToken || !sessionExpires) {
      console.log('🔐 [Auth] No hay datos de sesión, redirigiendo a login');
      window.location.href = '/login.html';
      return;
    }
    
    // Verificar si la sesión ha expirado
    const now = Date.now();
    const expiresAt = parseInt(sessionExpires);
    
    if (now > expiresAt) {
      console.log('🔐 [Auth] Sesión expirada, limpiando datos y redirigiendo a login');
      localStorage.removeItem('session_data');
      localStorage.removeItem('session_token');
      localStorage.removeItem('session_expires');
      window.location.href = '/login.html';
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
      console.log('🔐 [Auth] Usuario no autenticado, limpiando datos y redirigiendo a login');
      localStorage.removeItem('session_data');
      localStorage.removeItem('session_token');
      localStorage.removeItem('session_expires');
      window.location.href = '/login.html';
      return;
    }
    
    console.log('✅ [Auth] Usuario autenticado:', data.user.email);
    
  } catch (error) {
    console.error('❌ [Auth] Error verificando autenticación:', error);
    // Limpiar datos de sesión en caso de error
    localStorage.removeItem('session_data');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_expires');
    window.location.href = '/login.html';
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
        console.error('❌ [Auth] Error en logout:', error);
        // Redirigir de todas formas
        window.location.href = '/login.html';
      }
    });
  }
}

// Inicializar autenticación
checkAuthentication();
