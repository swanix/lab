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
      console.log('[AuthChecker] Verificando autenticación...');
      
      // Verificar si hay datos de sesión básicos
      const sessionData = localStorage.getItem('session_data');
      const sessionToken = localStorage.getItem('session_token');
      const sessionExpires = localStorage.getItem('session_expires');
      
      if (!sessionData || !sessionToken || !sessionExpires) {
        console.log('[AuthChecker] No hay sesión');
        this.handleUnauthenticated();
        return false;
      }
      
      // Verificar si la sesión ha expirado
      const now = Date.now();
      const expiresAt = parseInt(sessionExpires);
      
      if (now >= expiresAt) {
        console.log('[AuthChecker] Sesión expirada');
        this.handleUnauthenticated();
        return false;
      }
      
      // Verificar que el token sea válido con el servidor
      console.log('[AuthChecker] Verificando token con servidor...');
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
      
      console.log('[AuthChecker] Respuesta del servidor:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[AuthChecker] Resultado del servidor:', result);
        
        if (result.authenticated) {
          console.log('[AuthChecker] Usuario autenticado');
          this.handleAuthenticated(result);
          return true;
        } else {
          console.log('[AuthChecker] Usuario no autenticado según servidor');
        }
      } else {
        console.log('[AuthChecker] Error en respuesta del servidor:', response.status);
        const errorText = await response.text();
        console.log('[AuthChecker] Error details:', errorText);
      }
      
      console.log('[AuthChecker] Token inválido');
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
    } else {
      console.log('[AuthChecker] Usuario autenticado - no hay callback configurado');
    }
  }

  // Manejar usuario no autenticado
  handleUnauthenticated() {
    if (this.options.onUnauthenticated) {
      this.options.onUnauthenticated();
    } else if (this.options.redirectToLogin) {
      // Redirección automática al login
      window.location.href = '/login';
    } else {
      console.log('[AuthChecker] Usuario no autenticado - no hay callback configurado');
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
    console.log('[AuthChecker] Sesión limpiada');
  }
}

// Funciones de utilidad para casos comunes

// Verificar autenticación para landing page (mostrar landing o redirigir a dashboard)
async function checkAuthForLanding() {
  const checker = new AuthChecker({
    onAuthenticated: () => {
      console.log('[AuthChecker] Usuario autenticado, redirigiendo a dashboard');
      window.location.href = '/app/';
    },
    onUnauthenticated: () => {
      console.log('[AuthChecker] Usuario no autenticado, mostrando landing');
      // Esta función debe ser implementada en la página que la use
      if (typeof showLanding === 'function') {
        showLanding();
      }
    },
    onError: (error) => {
      console.error('[AuthChecker] Error en landing, mostrando página por defecto');
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
      console.log('[AuthChecker] Usuario autenticado, continuando');
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
