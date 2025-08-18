// Verificar autenticación
async function checkAuthentication() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    
    if (!session) {
      window.location.href = '/login.html';
      return;
    }
    
    const authPromise = fetch(`/.netlify/functions/check-auth?session=${encodeURIComponent(session)}`);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    const response = await Promise.race([authPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.authenticated) {
      window.location.href = '/login.html';
      return;
    }
    
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    window.location.href = '/login.html';
  }
}

// Configurar botón de logout
function setupLogout() {
  const logoutContainer = document.getElementById('logout-container');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutContainer && logoutBtn) {
    logoutContainer.style.display = 'block';
    
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      sessionStorage.clear();
      
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      window.location.href = '/api/logout';
    });
  }
}

// Inicializar autenticación
checkAuthentication();
