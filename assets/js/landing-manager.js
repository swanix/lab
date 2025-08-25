// LandingManager.js - Sistema de gestión del landing page reutilizable

class LandingManager {
  constructor(options = {}) {
    this.options = {
      loadingContainerId: 'loading-container',
      landingContainerId: 'landing-container',
      ...options
    };
    
    this.loadingContainer = null;
    this.landingContainer = null;
  }

  // Inicializar el manager
  init() {
    this.loadingContainer = document.getElementById(this.options.loadingContainerId);
    this.landingContainer = document.getElementById(this.options.landingContainerId);
    
    if (!this.loadingContainer) {
      console.warn(`[LandingManager] No se encontró el contenedor de loading: ${this.options.loadingContainerId}`);
    }
    
    if (!this.landingContainer) {
      console.warn(`[LandingManager] No se encontró el contenedor del landing: ${this.options.landingContainerId}`);
    }
  }

  // Mostrar el landing page
  showLanding() {
    console.log('[LandingManager] Mostrando landing page...');
    
    // Ocultar spinner de carga
    this.hideLoading();
    
    // Mostrar contenido del landing
    this.showLandingContent();
    
    // Configurar scroll y estilos
    this.setupLandingStyles();
    
    console.log('[LandingManager] Landing page mostrado correctamente');
  }

  // Ocultar spinner de carga
  hideLoading() {
    if (this.loadingContainer) {
      this.loadingContainer.style.display = 'none';
      console.log('[LandingManager] Spinner de carga ocultado');
    }
  }

  // Mostrar contenido del landing
  showLandingContent() {
    if (this.landingContainer) {
      this.landingContainer.style.display = 'flex';
      console.log('[LandingManager] Contenido del landing mostrado');
    }
  }

  // Configurar estilos del landing
  setupLandingStyles() {
    // Asegurar que el body tenga scroll normal
    document.body.style.overflow = 'auto';
    
    if (this.landingContainer) {
      // Forzar un reflow para asegurar que el contenido sea visible
      this.landingContainer.offsetHeight;
      
      // Asegurar que el contenido tenga z-index apropiado
      this.landingContainer.style.zIndex = '1';
      this.landingContainer.style.position = 'relative';
    }
    
    console.log('[LandingManager] Estilos del landing configurados');
  }

  // Ocultar el landing page
  hideLanding() {
    if (this.landingContainer) {
      this.landingContainer.style.display = 'none';
      console.log('[LandingManager] Landing page ocultado');
    }
  }

  // Mostrar spinner de carga
  showLoading() {
    if (this.loadingContainer) {
      this.loadingContainer.style.display = 'flex';
      console.log('[LandingManager] Spinner de carga mostrado');
    }
  }

  // Configurar timeout de seguridad
  setupSafetyTimeout(callback, timeoutMs = 5000) {
    setTimeout(() => {
      if (this.loadingContainer && this.loadingContainer.style.display !== 'none') {
        console.log('[LandingManager] Timeout de seguridad activado');
        if (callback && typeof callback === 'function') {
          callback();
        } else {
          this.showLanding();
        }
      }
    }, timeoutMs);
    
    console.log(`[LandingManager] Timeout de seguridad configurado para ${timeoutMs}ms`);
  }

  // Cargar tema guardado
  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    
    // Remover clase light-mode por defecto
    body.classList.remove('light-mode');
    
    // Aplicar tema guardado
    if (savedTheme === 'light') {
      body.classList.add('light-mode');
      console.log('[LandingManager] Tema light aplicado');
    } else {
      console.log('[LandingManager] Tema dark aplicado (por defecto)');
    }
  }

  // Verificar si el landing está visible
  isLandingVisible() {
    return this.landingContainer && 
           this.landingContainer.style.display !== 'none';
  }

  // Verificar si el loading está visible
  isLoadingVisible() {
    return this.loadingContainer && 
           this.loadingContainer.style.display !== 'none';
  }

  // Obtener estado actual
  getStatus() {
    return {
      loadingVisible: this.isLoadingVisible(),
      landingVisible: this.isLandingVisible(),
      loadingContainer: !!this.loadingContainer,
      landingContainer: !!this.landingContainer
    };
  }
}

// Funciones de utilidad para casos comunes

// Inicializar landing manager con configuración por defecto
function initLandingManager(options = {}) {
  const manager = new LandingManager(options);
  manager.init();
  return manager;
}

// Función de conveniencia para mostrar landing
function showLanding() {
  if (window.landingManager) {
    window.landingManager.showLanding();
  } else {
    console.warn('[LandingManager] No se encontró landingManager global');
  }
}

// Función de conveniencia para cargar tema
function loadTheme() {
  if (window.landingManager) {
    window.landingManager.loadTheme();
  } else {
    console.warn('[LandingManager] No se encontró landingManager global');
  }
}

// Función de conveniencia para configurar timeout de seguridad
function setupSafetyTimeout(callback, timeoutMs = 5000) {
  if (window.landingManager) {
    window.landingManager.setupSafetyTimeout(callback, timeoutMs);
  } else {
    console.warn('[LandingManager] No se encontró landingManager global');
  }
}

// Exportar para uso global
window.LandingManager = LandingManager;
window.initLandingManager = initLandingManager;
window.showLanding = showLanding;
window.loadTheme = loadTheme;
window.setupSafetyTimeout = setupSafetyTimeout;
