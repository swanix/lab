// Verificar autenticación usando cookies
async function checkAuthentication() {
  try {
    // Verificar si hay cookies de sesión
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    }, {});
    
    if (!cookies.session_token || !cookies.session_hash) {
      console.log('🔐 [Auth] No hay cookies de sesión, redirigiendo a login');
      window.location.href = '/login.html';
      return;
    }
    
    // Verificar autenticación con el servidor
    const authPromise = fetch('/.netlify/functions/check-auth', {
      credentials: 'include' // Incluir cookies en la petición
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
      console.log('🔐 [Auth] Usuario no autenticado, redirigiendo a login');
      window.location.href = '/login.html';
      return;
    }
    
    console.log('✅ [Auth] Usuario autenticado:', data.user.email);
    
  } catch (error) {
    console.error('❌ [Auth] Error verificando autenticación:', error);
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
        // Limpiar cookies del lado del cliente
        document.cookie = 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'session_hash=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        // Limpiar localStorage y sessionStorage
        localStorage.clear();
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
