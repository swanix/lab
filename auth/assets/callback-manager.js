// CallbackManager.js - Sistema de gestión del callback de autenticación reutilizable

class CallbackManager {
  constructor(options = {}) {
    this.options = {
      redirectDelay: 1000,
      verificationDelay: 500,
      ...options
    };
    
    this.elements = {};
    this.init();
  }

  init() {
    this.getDOMElements();
    this.initializeCallback();
  }

  getDOMElements() {
    this.elements = {
      status: document.getElementById('status'),
      userInfo: document.getElementById('user-info'),
      userEmail: document.getElementById('user-email'),
      errorMessage: document.getElementById('error-message'),
      successMessage: document.getElementById('success-message'),
      errorText: document.getElementById('error-text'),
      successText: document.getElementById('success-text')
    };
  }

  showMessage(type, text) {
    // Ocultar todos los mensajes primero
    this.elements.status.style.display = 'none';
    this.elements.errorMessage.style.display = 'none';
    this.elements.successMessage.style.display = 'none';

    if (type === 'error') {
      this.elements.errorText.textContent = text;
      this.elements.errorMessage.style.display = 'block';
    } else if (type === 'success') {
      this.elements.successText.textContent = text;
      this.elements.successMessage.style.display = 'block';
    } else {
      this.elements.status.textContent = text;
      this.elements.status.style.display = 'block';
    }
  }

  showUserInfo(email) {
    this.elements.userEmail.textContent = email;
    this.elements.userInfo.style.display = 'block';
  }

  configureSession(sessionData, sessionToken, expiresAt) {
    try {
      localStorage.setItem('session_data', JSON.stringify(sessionData));
      localStorage.setItem('session_token', sessionToken);
      localStorage.setItem('session_expires', expiresAt);
      
      console.log('[Auth Callback] Sesión configurada correctamente');
      return true;
    } catch (error) {
      console.error('[Auth Callback] Error configurando sesión:', error);
      return false;
    }
  }

  verifyStoredData() {
    const savedSessionData = localStorage.getItem('session_data');
    const savedSessionToken = localStorage.getItem('session_token');
    const savedSessionExpires = localStorage.getItem('session_expires');
    
    return !!(savedSessionData && savedSessionToken && savedSessionExpires);
  }

  redirectToDestination(redirectUrl, baseUrl) {
    if (redirectUrl && redirectUrl !== 'null') {
      const fullUrl = redirectUrl.startsWith('/') ? 
        baseUrl + redirectUrl : 
        baseUrl + '/' + redirectUrl;
      console.log('[Auth Callback] Redirigiendo a URL de destino:', fullUrl);
      window.location.href = fullUrl;
    } else {
      const dashboardUrl = baseUrl + '/app/';
      console.log('[Auth Callback] Redirigiendo al dashboard:', dashboardUrl);
      window.location.href = dashboardUrl;
    }
  }

  getUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      sessionData: urlParams.get('sessionData'),
      sessionToken: urlParams.get('sessionToken'),
      expiresAt: urlParams.get('expiresAt'),
      userEmail: urlParams.get('userEmail'),
      redirectUrl: urlParams.get('redirectUrl'),
      baseUrl: urlParams.get('baseUrl')
    };
  }

  async initializeCallback() {
    const params = this.getUrlParameters();
    
    this.showMessage('status', 'Configurando sesión...');

    if (!params.sessionData || !params.sessionToken || !params.expiresAt) {
      this.showMessage('error', 'Datos de sesión incompletos');
      return;
    }

    try {
      const sessionData = JSON.parse(decodeURIComponent(params.sessionData));
      
      // Configurar sesión
      if (this.configureSession(sessionData, params.sessionToken, params.expiresAt)) {
        this.showMessage('status', 'Sesión configurada correctamente');
        
        // Mostrar información del usuario si está disponible
        if (params.userEmail) {
          this.showUserInfo(decodeURIComponent(params.userEmail));
        }
        
        // Verificar que los datos se guardaron
        setTimeout(() => {
          if (this.verifyStoredData()) {
            this.showMessage('success', 'Datos verificados, redirigiendo...');
            
            // Redirigir después de un breve delay
            setTimeout(() => {
              this.redirectToDestination(
                params.redirectUrl, 
                params.baseUrl || window.location.origin
              );
            }, this.options.redirectDelay);
          } else {
            this.showMessage('error', 'Error verificando datos guardados');
          }
        }, this.options.verificationDelay);
      } else {
        this.showMessage('error', 'Error configurando la sesión');
      }
    } catch (error) {
      console.error('[Auth Callback] Error procesando datos:', error);
      this.showMessage('error', 'Error procesando datos de sesión');
    }
  }

  // Métodos de utilidad
  getStatus() {
    return {
      hasSessionData: !!localStorage.getItem('session_data'),
      hasSessionToken: !!localStorage.getItem('session_token'),
      hasSessionExpires: !!localStorage.getItem('session_expires'),
      isSessionValid: this.verifyStoredData()
    };
  }

  clearSession() {
    localStorage.removeItem('session_data');
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_expires');
  }
}

// Funciones de utilidad para casos comunes
function initCallbackManager(options = {}) {
  return new CallbackManager(options);
}

function initializeCallback() {
  const callbackManager = new CallbackManager();
  callbackManager.initializeCallback();
}

// Exportar para uso global
window.CallbackManager = CallbackManager;
window.initCallbackManager = initCallbackManager;
window.initializeCallback = initializeCallback;
