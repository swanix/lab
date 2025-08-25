// Configuración centralizada de proyectos
class AppsConfig {
  static async loadProjectConfig(projectId) {
    try {
      const response = await fetch(`/app/${projectId}/config.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[AppsConfig] Error cargando configuración:', error);
      throw error;
    }
  }

  static async initializeProject(projectId) {
    try {
      const config = await this.loadProjectConfig(projectId);
      
      // Configurar el título de la página
      if (config.title) {
        document.title = config.title;
      }

      // Configurar el logo
      if (config.logo) {
        const logoElement = document.querySelector('.logo');
        if (logoElement) {
          logoElement.src = config.logo;
          logoElement.alt = config.title || 'Logo';
        }
      }

      // Configurar XDiagrams si está disponible
      if (config.xdiagrams) {
        window.$xDiagrams = config.xdiagrams;
        console.log('[AppsConfig] XDiagrams configurado:', window.$xDiagrams);
      }

      console.log(`[AppsConfig] Aplicación ${projectId} inicializada correctamente`);
      return config;
    } catch (error) {
      console.error('[AppsConfig] Error inicializando aplicación:', error);
      
      // Mostrar mensaje de error más útil
      let availableApps = [];
      try {
        availableApps = await this.getAllApps();
      } catch (e) {
        console.warn('[AppsConfig] No se pudieron cargar las aplicaciones para el mensaje de error');
      }

      const appsList = availableApps.length > 0
        ? availableApps.map(p => `<strong>${p.id}</strong>`).join(', ')
        : 'ninguna aplicación disponible';

      const errorMessage = `
        <div class="error-container">
          <h2>❌ Aplicación no encontrada</h2>
          <p>La aplicación <strong>${projectId}</strong> no existe o no está configurada correctamente.</p>
          <p>Aplicaciones disponibles: ${appsList}</p>
          <p>Para agregar una nueva aplicación:</p>
          <ol>
            <li>Crear carpeta: <code>app/${projectId}/</code></li>
            <li>Crear archivo: <code>app/${projectId}/config.json</code></li>
            <li>Crear carpeta: <code>app/${projectId}/img/</code></li>
            <li>Crear archivo: <code>app/${projectId}/img/logo.svg</code></li>
            <li>Agregar entrada en <code>/app/app.json</code></li>
          </ol>
        </div>
      `;

      const appContainer = document.getElementById('app-container');
      if (appContainer) {
        appContainer.innerHTML = errorMessage;
      }
      
      throw error;
    }
  }

  static getProjectIdFromPath() {
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part.length > 0);
    
    // Si estamos en /app/, buscar el segundo segmento
    if (pathParts.length > 0 && pathParts[0] === 'app') {
      if (pathParts.length > 1) {
        const projectId = pathParts[1];
        console.log(`[AppsConfig] ProjectId detectado en URL: ${projectId}`);
        return projectId;
      }
      return null; // Estamos en /app/ sin proyecto específico
    }
    
    // Para rutas directas como /project-01/
    if (pathParts.length > 0) {
      const projectId = pathParts[0];
      console.log(`[AppsConfig] ProjectId detectado en URL: ${projectId}`);
      return projectId;
    }
    
    return null;
  }

  static async getAllApps() {
    try {
      console.log('[AppsConfig] Cargando lista de aplicaciones desde /app/app.json...');
      const response = await fetch('/app/app.json');
      if (!response.ok) {
        throw new Error(`No se pudo leer /app/app.json (HTTP ${response.status})`);
      }
      const data = await response.json();
      const apps = Array.isArray(data.apps) ? data.apps : [];
      console.log(`[AppsConfig] Total de aplicaciones cargadas: ${apps.length}`);
      return apps;
    } catch (error) {
      console.error('[AppsConfig] Error cargando aplicaciones:', error);
      return [];
    }
  }

  static generateAppsGrid(apps) {
    if (!apps || apps.length === 0) {
      return `
        <div class="error-container">
          <h2>❌ No hay aplicaciones disponibles</h2>
          <p>No se encontraron aplicaciones configuradas.</p>
        </div>
      `;
    }

    const appsHTML = apps.map(app => `
      <div class="app-card" onclick="window.location.href='${app.url}'">
        <div class="app-logo">
          <img src="/app/${app.id}/img/logo.svg" alt="${app.title}" onerror="this.style.display='none'">
        </div>
        <div class="app-info">
          <h3>${app.title}</h3>
          <p>${app.description}</p>
        </div>
      </div>
    `).join('');

    return `
      <div class="apps-grid">
        ${appsHTML}
      </div>
      <button id="apps-btn" title="Listado de Aplicaciones">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        Aplicaciones
      </button>
    `;
  }

  static generateAppsGridContent(apps) {
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
      // Usar ruta relativa desde /app/ para que funcione desde app/index.html
      const logoPath = `${app.id}/img/logo.svg`;
      console.log(`[AppsConfig] Generando logo para ${app.id}: ${logoPath}`);
      return `
        <div class="app-card" onclick="window.location.href='${app.url}'">
          <div class="app-logo">
            <img src="${logoPath}" alt="${app.title}" 
                 onerror="console.error('[AppsConfig] Error cargando logo:', this.src); this.style.display='none'"
                 onload="console.log('[AppsConfig] Logo cargado exitosamente:', this.src)">
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

  static showDebugInfo(projectId) {
    console.log(`[AppsConfig] Para agregar la aplicación '${projectId}':`);
    console.log(`1. Crear carpeta: app/${projectId}/`);
    console.log(`2. Crear archivo: app/${projectId}/config.json`);
    console.log(`3. Crear carpeta: app/${projectId}/img/`);
    console.log(`4. Crear archivo: app/${projectId}/img/logo.svg`);
    console.log(`5. Agregar entrada en /app/app.json`);
  }
}
