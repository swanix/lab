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
    this.currentProjectId = null;
    this.isNavigating = false;
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
      
      // Configurar navegación SPA
      this.setupSPANavigation();
      
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

  // Configurar navegación SPA
  setupSPANavigation() {
    // Interceptar clicks en app-cards para navegación SPA
    document.addEventListener('click', async (event) => {
      const appCard = event.target.closest('.app-card');
      if (appCard && !this.isNavigating) {
        event.preventDefault();
        event.stopPropagation();
        
        // Obtener la URL del proyecto desde el onclick o data attribute
        const projectUrl = appCard.getAttribute('data-project-url') || 
                          appCard.onclick?.toString().match(/window\.location\.href='([^']+)'/)?.[1];
        
        if (projectUrl) {
          const projectId = this.extractProjectIdFromUrl(projectUrl);
          if (projectId) {
            await this.navigateToProjectSPA(projectId);
          }
        }
      }
    });
  }

  // Extraer ID del proyecto desde URL
  extractProjectIdFromUrl(url) {
    const match = url.match(/\/([^\/]+)\/?$/);
    return match ? match[1] : null;
  }

  // Cargar proyecto específico
  async loadProject(projectId) {
    try {
      console.log(`[AppRouter] Cargando proyecto: ${projectId}`);
      
      // Prevenir navegación múltiple
      if (this.isNavigating) {
        console.log('[AppRouter] Navegación en progreso, ignorando...');
        return;
      }
      
      this.isNavigating = true;
      this.currentProjectId = projectId;
      
      // Limpiar el contenedor ANTES de cargar el nuevo contenido
      if (this.container) {
        this.container.innerHTML = '';
        console.log('[AppRouter] Contenedor limpiado para cargar proyecto');
      }
      
      // Cambiar clase del body para pantalla completa
      document.body.className = 'project-page';
      
      // Inicializar aplicación específica ANTES de cargar XDiagrams
      await AppsConfig.initializeProject(projectId);
      console.log(`[AppRouter] Aplicación ${projectId} cargada correctamente`);
      
      // Ahora cargar XDiagrams después de tener la configuración
      this.loadXDiagrams();
      
      // Actualizar URL sin recargar la página
      this.updateURL(`/${projectId}/`, projectId);
      
      this.isNavigating = false;
      
    } catch (error) {
      console.error(`[AppRouter] Error cargando proyecto ${projectId}:`, error);
      this.showError(`Error cargando la aplicación ${projectId}`);
      this.isNavigating = false;
    }
  }

  // Mostrar dashboard de aplicaciones
  async showDashboard() {
    try {
      console.log('[AppRouter] Mostrando dashboard de aplicaciones');
      
      // Prevenir navegación múltiple
      if (this.isNavigating) {
        console.log('[AppRouter] Navegación en progreso, ignorando...');
        return;
      }
      
      this.isNavigating = true;
      this.currentProjectId = null;
      
      // Limpiar el contenedor ANTES de cargar el nuevo contenido
      if (this.container) {
        this.container.innerHTML = '';
        console.log('[AppRouter] Contenedor limpiado para cargar dashboard');
      }
      
      // Mantener clase dashboard para la lista de aplicaciones
      document.body.className = 'dashboard-page';
      
      // Cargar aplicaciones dinámicamente
      const apps = await AppsConfig.getAllApps();
      
      // Generar HTML del grid con navegación SPA
      const appsHTML = this.generateAppsGridWithSPA(apps);
      
      // Solo reemplazar el contenido del contenedor
      if (this.container) {
        this.container.innerHTML = appsHTML;
      }
      
      // Actualizar URL sin recargar la página
      this.updateURL('/app/', null);
      
      console.log('[AppRouter] Grid de aplicaciones generado dinámicamente');
      
      this.isNavigating = false;
      
    } catch (error) {
      console.error('[AppRouter] Error cargando aplicaciones:', error);
      this.showError('Error al cargar aplicaciones');
      this.isNavigating = false;
    }
  }

  // Generar grid de aplicaciones con navegación SPA
  generateAppsGridWithSPA(apps) {
    if (!apps || apps.length === 0) {
      return `
        <div class="error-container">
          <h2>❌ No hay aplicaciones disponibles</h2>
          <p>No se encontraron aplicaciones configuradas.</p>
          <p>Para agregar una nueva aplicación:</p>
          <ol>
            <li>Crear carpeta: <code>app/nombre-app/</code></li>
            <li>Crear archivo: <code>app/nombre-app/config.json</code></li>
            <li>Crear carpeta: <code>app/nombre-app/img/</code></li>
            <li>Crear archivo: <code>app/nombre-app/img/logo.svg</code></li>
            <li>Agregar entrada en <code>/app/app.json</code></li>
          </ol>
        </div>
      `;
    }

    const appsHTML = apps.map(app => {
      const projectId = this.extractProjectIdFromUrl(app.url);
      const logoPath = `/app/${app.id}/img/logo.svg`;
      
      return `
        <div class="app-card" data-project-url="${app.url}" data-project-id="${projectId}">
          <div class="app-logo">
            <img src="${logoPath}" alt="${app.title}" 
                 onerror="console.error('[AppRouter] Error cargando logo:', this.src); this.style.display='none'"
                 onload="console.log('[AppRouter] Logo cargado exitosamente:', this.src)">
          </div>
          <div class="app-info">
            <h3>${app.title}</h3>
            <p>${app.description}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="apps-grid">
        ${appsHTML}
      </div>
    `;
  }

  // Mostrar indicador de carga (simplificado)
  showLoadingIndicator() {
    // El diagrama ya tiene su propio indicador de carga
    // No necesitamos mostrar un spinner adicional
  }

  // Ocultar indicador de carga
  hideLoadingIndicator() {
    // No es necesario hacer nada aquí
  }

  // Cargar XDiagrams dinámicamente
  loadXDiagrams() {
    const script = document.createElement('script');
    script.src = '/assets/vendor/xdiagrams.min.js';
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
    // Configurar botón de aplicaciones con navegación SPA
    if (this.appsBtn) {
      this.appsBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await this.navigateToDashboardSPA();
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

  // Navegar a proyecto usando SPA
  async navigateToProjectSPA(projectId) {
    console.log(`[AppRouter] Navegando a proyecto: ${projectId}`);
    await this.loadProject(projectId);
  }

  // Navegar al dashboard usando SPA
  async navigateToDashboardSPA() {
    console.log('[AppRouter] Navegando al dashboard');
    await this.showDashboard();
  }

  // Actualizar URL sin recargar la página
  updateURL(path, projectId) {
    const newUrl = window.location.origin + path;
    window.history.pushState({ projectId }, '', newUrl);
    console.log(`[AppRouter] URL actualizada: ${newUrl}`);
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

  // Navegar a una aplicación específica (método legacy)
  navigateToProject(projectId) {
    if (projectId) {
      window.location.href = `/${projectId}/`;
    }
  }

  // Navegar al dashboard (método legacy)
  navigateToDashboard() {
    window.location.href = '/app/';
  }

  // Obtener información del proyecto actual
  getCurrentProject() {
    return this.currentProjectId || AppsConfig.getProjectIdFromPath();
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
