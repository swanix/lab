// AppRouter.js - Sistema de routing de aplicaciones reutilizable

class AppRouter {
  constructor(options = {}) {
    this.options = {
      containerId: 'app',
      headerControlsId: 'header-controls',
      appsBtnId: 'apps-btn',
      ...options
    };
    
    this.container = null;
    this.headerControls = null;
    this.appsBtn = null;
    this.userMenu = null;
  }

  // Inicializar el router
  async init() {
    try {
      console.log('[AppRouter] Inicializando router...');
      
      // Verificar autenticación usando el nuevo sistema
      const isAuthenticated = await checkAuthForProtectedPage();
      
      if (!isAuthenticated) {
        console.log('[AppRouter] Usuario no autenticado, redirigiendo...');
        return; // La redirección ya se maneja en checkAuthForProtectedPage
      }
      
      // Configurar elementos del DOM
      this.setupDOMElements();
      
      // Obtener ID del proyecto desde la URL
      const projectId = AppsConfig.getProjectIdFromPath();
      
      if (projectId) {
        // Cargar aplicación específica
        await this.loadProject(projectId);
      } else {
        // Mostrar dashboard de aplicaciones
        await this.showDashboard();
      }
      
      // Configurar controles de header
      this.setupHeaderControls();
      
      // Pequeña pausa para asegurar que todo esté listo
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Remover clase de loading para mostrar contenido
      document.body.classList.remove('loading');
      
      console.log('[AppRouter] Router inicializado correctamente');
      
    } catch (error) {
      console.error('[AppRouter] Error inicializando router:', error);
      // La autenticación ya maneja la redirección
      document.body.classList.remove('loading');
    }
  }

  // Configurar elementos del DOM
  setupDOMElements() {
    this.container = document.getElementById(this.options.containerId);
    this.headerControls = document.getElementById(this.options.headerControlsId);
    this.appsBtn = document.getElementById(this.options.appsBtnId);
    
    if (!this.container) {
      console.error(`[AppRouter] No se encontró el contenedor con ID: ${this.options.containerId}`);
    }
    
    if (!this.headerControls) {
      console.error(`[AppRouter] No se encontró el header controls con ID: ${this.options.headerControlsId}`);
    }
  }

  // Cargar proyecto específico
  async loadProject(projectId) {
    try {
      console.log(`[AppRouter] Cargando proyecto: ${projectId}`);
      
      // Cambiar clase del body para pantalla completa
      document.body.className = 'project-page';
      
      // Inicializar aplicación específica ANTES de cargar XDiagrams
      await AppsConfig.initializeProject(projectId);
      console.log(`[AppRouter] Aplicación ${projectId} cargada correctamente`);
      
      // Ahora cargar XDiagrams después de tener la configuración
      this.loadXDiagrams();
      
    } catch (error) {
      console.error(`[AppRouter] Error cargando proyecto ${projectId}:`, error);
      this.showError(`Error cargando la aplicación ${projectId}`);
    }
  }

  // Mostrar dashboard de aplicaciones
  async showDashboard() {
    try {
      console.log('[AppRouter] Mostrando dashboard de aplicaciones');
      
      // Mantener clase dashboard para la lista de aplicaciones
      document.body.className = 'dashboard-page';
      
      // Cargar aplicaciones dinámicamente
      const apps = await AppsConfig.getAllApps();
      
      // Generar HTML del grid (solo el contenido, sin header-controls)
      const appsHTML = AppsConfig.generateAppsGridContent(apps);
      
      // Solo reemplazar el contenido del contenedor
      if (this.container) {
        this.container.innerHTML = appsHTML;
      }
      
      console.log('[AppRouter] Grid de aplicaciones generado dinámicamente');
      
    } catch (error) {
      console.error('[AppRouter] Error cargando aplicaciones:', error);
      this.showError('Error al cargar aplicaciones');
    }
  }

  // Cargar XDiagrams dinámicamente
  loadXDiagrams() {
    const script = document.createElement('script');
    script.src = '/assets/xdiagrams.min.js';
    script.onload = function() {
      console.log('[AppRouter] XDiagrams cargado correctamente');
    };
    script.onerror = function() {
      console.error('[AppRouter] Error cargando XDiagrams');
    };
    document.head.appendChild(script);
  }

  // Configurar controles de header
  setupHeaderControls() {
    // Configurar botón de aplicaciones
    if (this.appsBtn) {
      this.appsBtn.addEventListener('click', () => {
        window.location.href = '/app/';
      });
    }
    
    // Inicializar menú de usuario si está disponible
    if (typeof UserMenu !== 'undefined') {
      this.userMenu = new UserMenu();
      this.userMenu.init();
    } else {
      console.warn('[AppRouter] UserMenu no está disponible');
    }
  }

  // Mostrar mensaje de error
  showError(message) {
    if (this.container) {
      this.container.innerHTML = `
        <div class="dashboard-container">
          <h1>❌ Error</h1>
          <p>${message}</p>
          <p>Intenta recargar la página o contacta al administrador.</p>
        </div>
      `;
    }
  }

  // Navegar a una aplicación específica
  navigateToProject(projectId) {
    if (projectId) {
      window.location.href = `/${projectId}/`;
    }
  }

  // Navegar al dashboard
  navigateToDashboard() {
    window.location.href = '/app/';
  }

  // Obtener información del proyecto actual
  getCurrentProject() {
    return AppsConfig.getProjectIdFromPath();
  }

  // Verificar si estamos en un proyecto específico
  isProjectPage() {
    const projectId = this.getCurrentProject();
    return projectId !== null;
  }

  // Verificar si estamos en el dashboard
  isDashboardPage() {
    return !this.isProjectPage();
  }
}

// Exportar para uso global
window.AppRouter = AppRouter;
