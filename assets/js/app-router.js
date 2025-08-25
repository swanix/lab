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
      
      // Crear floating app icon
      this.createFloatingAppIcon();
      
      // Crear floating project pill
      this.createFloatingProjectPill(projectId);
      
      // Ocultar floating-title-pill de XDiagrams
      this.hideXDiagramsTitlePill();
      
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
      
      // Limpiar elementos de XDiagrams ANTES de limpiar el contenedor
      this.cleanupXDiagramsElements();
      
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
      
      // Crear floating app icon para el dashboard también
      this.createFloatingAppIcon();
      
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

  // Limpiar elementos de XDiagrams
  cleanupXDiagramsElements() {
    try {
      // Limpiar floating-title-pill
      const floatingTitlePill = document.querySelector('.floating-title-pill');
      if (floatingTitlePill) {
        floatingTitlePill.remove();
        console.log('[AppRouter] Floating title pill removido');
      }

      // Limpiar floating project pill
      const floatingProjectPill = document.querySelector('.floating-project-pill');
      if (floatingProjectPill) {
        floatingProjectPill.remove();
        console.log('[AppRouter] Floating project pill removido');
      }

      // Limpiar controles de zoom
      const zoomControls = document.querySelector('.zoom-controls');
      if (zoomControls) {
        zoomControls.remove();
        console.log('[AppRouter] Controles de zoom removidos');
      }

      // Limpiar otros elementos de XDiagrams que puedan quedar
      const xdiagramsElements = document.querySelectorAll('[class*="xdiagrams"], [class*="floating"], [class*="zoom"]');
      xdiagramsElements.forEach(element => {
        if (element.classList.contains('floating-title-pill') || 
            element.classList.contains('floating-project-pill') ||
            element.classList.contains('zoom-controls') ||
            element.classList.contains('zoom-in') ||
            element.classList.contains('zoom-out') ||
            element.classList.contains('zoom-reset')) {
          element.remove();
        }
      });

      // Limpiar cualquier script de XDiagrams que se haya agregado dinámicamente
      const xdiagramsScripts = document.querySelectorAll('script[src*="xdiagrams"]');
      xdiagramsScripts.forEach(script => {
        if (script.src.includes('xdiagrams.min.js')) {
          script.remove();
          console.log('[AppRouter] Script de XDiagrams removido');
        }
      });

      // Desconectar observer de XDiagrams si existe
      if (this.xdiagramsObserver) {
        this.xdiagramsObserver.disconnect();
        this.xdiagramsObserver = null;
        console.log('[AppRouter] Observer de XDiagrams desconectado');
      }

      // Limpiar intervalo de ocultación si existe
      if (this.xdiagramsHideInterval) {
        clearInterval(this.xdiagramsHideInterval);
        this.xdiagramsHideInterval = null;
        console.log('[AppRouter] Intervalo de ocultación de XDiagrams limpiado');
      }

      console.log('[AppRouter] Limpieza de elementos XDiagrams completada');
    } catch (error) {
      console.warn('[AppRouter] Error limpiando elementos XDiagrams:', error);
    }
  }

  // Crear floating app icon (solo si no existe)
  createFloatingAppIcon() {
    try {
      // Verificar si ya existe el floating app icon
      const existingIcon = document.querySelector('.floating-app-icon');
      if (existingIcon) {
        console.log('[AppRouter] Floating app icon ya existe, no se crea uno nuevo');
        return;
      }

      // Crear el elemento floating app icon con el logo del lab
      const floatingAppIcon = document.createElement('div');
      floatingAppIcon.className = 'floating-app-icon';
      floatingAppIcon.innerHTML = `
        <div class="floating-app-icon-container">
          <img src="/assets/img/favicon.svg" alt="Lab" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <div class="floating-app-icon-fallback" style="display: none;">
            <span>L</span>
          </div>
        </div>
      `;

      // Agregar al body
      document.body.appendChild(floatingAppIcon);
      console.log('[AppRouter] Floating app icon creado con logo del lab');
    } catch (error) {
      console.warn('[AppRouter] Error creando floating app icon:', error);
    }
  }

  // Crear floating project pill
  createFloatingProjectPill(projectId) {
    try {
      // Remover floating project pill existente si hay uno
      const existingPill = document.querySelector('.floating-project-pill');
      if (existingPill) {
        existingPill.remove();
      }

      // Crear el elemento floating project pill
      const floatingProjectPill = document.createElement('div');
      floatingProjectPill.className = 'floating-project-pill';
      floatingProjectPill.innerHTML = `
        <div class="floating-project-pill-container">
          <div class="project-icon">
            <img src="/app/${projectId}/img/logo.svg" alt="${projectId}" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="project-icon-fallback" style="display: none;">
              <span>${projectId.charAt(0).toUpperCase()}</span>
            </div>
          </div>
          <div class="project-name">
            <span>${projectId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          </div>
        </div>
      `;

      // Agregar al body
      document.body.appendChild(floatingProjectPill);
      console.log(`[AppRouter] Floating project pill creado para ${projectId}`);
    } catch (error) {
      console.warn('[AppRouter] Error creando floating project pill:', error);
    }
  }

  // Ocultar floating-title-pill de XDiagrams de forma agresiva
  hideXDiagramsTitlePill() {
    try {
      // Ocultar inmediatamente si ya existe
      const xdiagramsTitlePill = document.querySelector('.floating-title-pill');
      if (xdiagramsTitlePill) {
        xdiagramsTitlePill.style.display = 'none';
        xdiagramsTitlePill.style.visibility = 'hidden';
        xdiagramsTitlePill.style.opacity = '0';
        xdiagramsTitlePill.style.pointerEvents = 'none';
        console.log('[AppRouter] Floating title pill de XDiagrams ocultado inmediatamente');
      }

      // Configurar observer para detectar cuando XDiagrams crea el pill
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Verificar si el nodo agregado es el floating-title-pill
              if (node.classList && node.classList.contains('floating-title-pill')) {
                node.style.display = 'none';
                node.style.visibility = 'hidden';
                node.style.opacity = '0';
                node.style.pointerEvents = 'none';
                console.log('[AppRouter] Floating title pill de XDiagrams interceptado y ocultado');
              }
              
              // También verificar elementos hijos que puedan ser el pill
              const titlePills = node.querySelectorAll && node.querySelectorAll('.floating-title-pill, [class*="floating-title"], [class*="title-pill"]');
              titlePills.forEach(pill => {
                pill.style.display = 'none';
                pill.style.visibility = 'hidden';
                pill.style.opacity = '0';
                pill.style.pointerEvents = 'none';
                console.log('[AppRouter] Floating title pill hijo interceptado y ocultado');
              });
            }
          });
        });
      });

      // Observar cambios en el body para detectar cuando XDiagrams agrega elementos
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Guardar el observer para poder desconectarlo más tarde
      this.xdiagramsObserver = observer;
      
      console.log('[AppRouter] Observer configurado para interceptar floating title pills de XDiagrams');
      
      // También configurar un intervalo para forzar la ocultación cada 2 segundos
      this.xdiagramsHideInterval = setInterval(() => {
        const titlePills = document.querySelectorAll('.floating-title-pill, [class*="floating-title"], [class*="title-pill"]');
        titlePills.forEach(pill => {
          if (pill.style.display !== 'none') {
            pill.style.display = 'none';
            pill.style.visibility = 'hidden';
            pill.style.opacity = '0';
            pill.style.pointerEvents = 'none';
            console.log('[AppRouter] Floating title pill forzado a ocultarse');
          }
        });
      }, 2000);
      
    } catch (error) {
      console.warn('[AppRouter] Error configurando ocultación de floating title pill:', error);
    }
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
