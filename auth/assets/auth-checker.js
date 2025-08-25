// AuthChecker.js - Sistema de verificación de autenticación reutilizable

class AuthChecker {
  constructor(options = {}) {
    this.options = {
      onAuthenticated: null,    // Callback cuando está autenticado
      onUnauthenticated: null,  // Callback cuando no está autenticado
      onError: null,            // Callback en caso de error
      redirectToLogin: false,   // Si debe redirigir al login automáticamente
      ...options
    };
  }

  // Verificar autenticación y ejecutar callbacks correspondientes
  async checkAuthAndExecute() {
    try {
      // Verificar si hay datos de sesión básicos
      const sessionData = localStorage.getItem('session_data');
      const sessionToken = localStorage.getItem('session_token');
      const sessionExpires = localStorage.getItem('session_expires');
      
      if (!sessionData || !sessionToken || !sessionExpires) {
        this.handleUnauthenticated();
        return false;
      }
      
      // Verificar si la sesión ha expirado
      const now = Date.now();
      const expiresAt = parseInt(sessionExpires);
      
      if (now >= expiresAt) {
        this.handleUnauthenticated();
        return false;
      }
      
      // Verificar que el token sea válido con el servidor
      const response = await fetch('/.netlify/functions/check-auth', {
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
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.authenticated) {
          this.handleAuthenticated(result);
          return true;
        }
      }
      
      this.handleUnauthenticated();
      return false;
      
    } catch (error) {
      console.error('[AuthChecker] Error verificando autenticación:', error);
      this.handleError(error);
      return false;
    }
  }

  // Manejar usuario autenticado
  handleAuthenticated(userData = null) {
    if (this.options.onAuthenticated) {
      this.options.onAuthenticated(userData);
    }
  }

  // Manejar usuario no autenticado
  handleUnauthenticated() {
    if (this.options.onUnauthenticated) {
      this.options.onUnauthenticated();
    } else if (this.options.redirectToLogin) {
      // Redirección automática al login
      window.location.href = '/login';
    }
  }

  // Manejar errores
  handleError(error) {
    if (this.options.onError) {
      this.options.onError(error);
    } else {
      console.error('[AuthChecker] Error no manejado:', error);
    }
  }

  // Verificar autenticación de forma síncrona (solo datos locales)
  checkAuthSync() {
    const sessionData = localStorage.getItem('session_data');
    const sessionToken = localStorage.getItem('session_token');
    const sessionExpires = localStorage.getItem('session_expires');
    
    if (!sessionData || !sessionToken || !sessionExpires) {
      return false;
    }
    
    const now = Date.now();
    const expiresAt = parseInt(sessionExpires);
    
    return now < expiresAt;
  }

  // Obtener datos del usuario actual
  getCurrentUser() {
    try {
      const sessionData = localStorage.getItem('session_data');
      if (sessionData) {
        return JSON.parse(sessionData);
      }
    } catch (error) {
      console.error('[AuthChecker] Error parseando datos de sesión:', error);
    }
    return null;
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role) {
    const user = this.getCurrentUser();
    if (user && user.roles) {
      return user.roles.includes(role);
    }
    return false;
  }

  // Verificar si el usuario tiene permisos específicos
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (user && user.permissions) {
      return user.permissions.includes(permission);
    }
    return false;
  }

  // Limpiar datos de sesión
  clearSession() {
    localStorage.removeItem('session_data');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_expires');
  }
}

// Funciones de utilidad para casos comunes

// Verificar autenticación para landing page (mostrar landing o redirigir a dashboard)
async function checkAuthForLanding() {
  const checker = new AuthChecker({
    onAuthenticated: () => {
      window.location.href = '/app/';
    },
    onUnauthenticated: () => {
      // Esta función debe ser implementada en la página que la use
      if (typeof showLanding === 'function') {
        showLanding();
      }
    },
    onError: (error) => {
      if (typeof showLanding === 'function') {
        showLanding();
      }
    }
  });
  
  return await checker.checkAuthAndExecute();
}

// Verificar autenticación para páginas protegidas (redirigir al login si no está autenticado)
async function checkAuthForProtectedPage() {
  const checker = new AuthChecker({
    redirectToLogin: true,
    onAuthenticated: () => {
      // Remover loading spinner si existe
      const loadingContainer = document.getElementById('loading-container');
      if (loadingContainer) {
        loadingContainer.style.display = 'none';
      }
      document.body.classList.remove('loading');
    },
    onError: (error) => {
      console.error('[AuthChecker] Error en página protegida, redirigiendo al login');
      window.location.href = '/login';
    }
  });
  
  return await checker.checkAuthAndExecute();
}

// Verificar autenticación para API calls
async function checkAuthForAPI() {
  const checker = new AuthChecker();
  return await checker.checkAuthAndExecute();
}

// Exportar para uso global
window.AuthChecker = AuthChecker;
window.checkAuthForLanding = checkAuthForLanding;
window.checkAuthForProtectedPage = checkAuthForProtectedPage;
window.checkAuthForAPI = checkAuthForAPI;
