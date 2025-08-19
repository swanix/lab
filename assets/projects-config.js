// Configuración centralizada de proyectos
class ProjectsConfig {
  static async loadProjectConfig(projectId) {
    try {
      const response = await fetch(`/projects/${projectId}/config.json`);
      if (!response.ok) {
        throw new Error(`Proyecto ${projectId} no encontrado`);
      }
      return await response.json();
    } catch (error) {
      console.error('[ProjectsConfig] Error cargando configuración:', error);
      throw error;
    }
  }

  static async initializeProject(projectId) {
    try {
      // Cargar configuración del proyecto
      const config = await this.loadProjectConfig(projectId);
      
      // Configurar XDiagrams con la configuración del proyecto
      window.$xDiagrams = {
        url: config.url,
        title: config.title,
        logo: `/projects/${projectId}/img/logo.svg`,
        clustersPerRow: config.clustersPerRow,
        showThemeToggle: config.showThemeToggle,
        spacing: config.spacing,
        verticalSpacing: config.verticalSpacing,
        nodeWidth: config.nodeWidth,
        nodeHeight: config.nodeHeight
      };

      // Actualizar título de la página
      document.title = config.title;
      
      console.log(`[ProjectsConfig] Proyecto ${projectId} inicializado correctamente`);
      return config;
      
    } catch (error) {
      console.error('[ProjectsConfig] Error inicializando proyecto:', error);
      // Mostrar página de error usando la estética centralizada
      // Cargar lista de proyectos disponibles para mostrar en el error
      let availableProjects = [];
      try {
        availableProjects = await this.getAllProjects();
      } catch (error) {
        console.warn('[ProjectsConfig] No se pudieron cargar los proyectos para el mensaje de error');
      }
      
      const projectsList = availableProjects.length > 0 
        ? availableProjects.map(p => `<strong>${p.id}</strong>`).join(', ')
        : 'No hay proyectos disponibles';
      
      document.body.innerHTML = `
        <div class="forbidden-container">
          <div class="logo">
            <img src="/assets/favicon.svg" alt="Logo" class="logo-img">
          </div>
          <h1>Proyecto no encontrado</h1>
          <p>El proyecto <strong>${projectId}</strong> no existe o no está disponible.</p>
          <div class="error-details">
            <h3>Proyectos disponibles:</h3>
            <p>${projectsList}</p>
          </div>
          <div class="button-group">
            <a href="/" class="back-button">← Volver al inicio</a>
          </div>
        </div>
      `;
      throw error;
    }
  }

  static getProjectIdFromPath() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    // Si hay un segmento en la ruta, retornarlo como projectId
    // Esto permite cualquier nombre de proyecto, no solo "project-*"
    if (segments.length > 0) {
      const projectId = segments[0];
      console.log(`[ProjectsConfig] ProjectId detectado en URL: ${projectId}`);
      return projectId;
    }
    
    return null;
  }

  static async getAllProjects() {
    try {
      console.log('[ProjectsConfig] Cargando lista de proyectos desde /projects/projects.json...');
      const response = await fetch('/projects/projects.json');
      if (!response.ok) {
        throw new Error(`No se pudo leer /projects/projects.json (HTTP ${response.status})`);
      }
      const data = await response.json();
      const projects = Array.isArray(data.projects) ? data.projects : [];
      console.log(`[ProjectsConfig] Total de proyectos cargados: ${projects.length}`);
      return projects;
    } catch (error) {
      console.error('[ProjectsConfig] Error cargando proyectos:', error);
      return [];
    }
  }

  static generateProjectsGrid(projects) {
    if (!projects || projects.length === 0) {
      return `
        <div class="dashboard-container">
          <h1>No hay proyectos disponibles</h1>
          <p>No se encontraron proyectos configurados en el sistema.</p>
          <div id="header-controls">
            <button id="projects-btn" title="Listado de Proyectos">
              <svg class="grid-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 3v7h7V3H3zm9 0v7h7V3h-7zM3 14v7h7v-7H3zm9 0v7h7v-7h-7z"/>
              </svg>
              Proyectos
            </button>
            <div class="user-menu-container">
              <button id="user-menu-trigger" class="user-menu-trigger" title="Menú de usuario">
                <img id="user-avatar" src="/assets/favicon.svg" alt="Usuario" class="user-avatar">
              </button>
              <div id="user-menu" class="user-menu">
                <div class="user-info">
                  <img id="user-avatar-large" src="/assets/favicon.svg" alt="Usuario" class="user-avatar-large">
                  <div class="user-details">
                    <div id="user-name" class="user-name">Usuario</div>
                    <div id="user-email" class="user-email">usuario@gmail.com</div>
                  </div>
                  <button id="theme-toggle" class="theme-toggle" title="Cambiar tema">
                    <svg class="theme-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
                    </svg>
                  </button>
                </div>
                <div class="user-menu-separator"></div>
                <button id="logout-btn" class="user-menu-logout">
                  <svg class="logout-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 12v3a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5v-3"/>
                    <polyline points="16 8 20 12 16 16"/>
                    <line x1="20" y1="12" x2="10" y2="12"/>
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const projectsHTML = projects.map(project => `
      <a href="${project.url}" class="project-card">
        <div class="project-logo">
          <img src="/projects/${project.id}/img/logo.svg" alt="${project.title}" onerror="this.style.display='none'">
        </div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
      </a>
    `).join('');

    return `
      <div class="dashboard-container">
        <h1>Proyectos XDiagrams</h1>
        <p>Selecciona un proyecto para continuar:</p>
        <div class="projects-grid">
          ${projectsHTML}
        </div>
        <div id="header-controls">
          <button id="projects-btn" title="Listado de Proyectos">
            <svg class="grid-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3v7h7V3H3zm9 0v7h7V3h-7zM3 14v7h7v-7H3zm9 0v7h7v-7h-7z"/>
            </svg>
            Proyectos
          </button>
          <div class="user-menu-container">
            <button id="user-menu-trigger" class="user-menu-trigger" title="Menú de usuario">
              <img id="user-avatar" src="/assets/favicon.svg" alt="Usuario" class="user-avatar">
            </button>
            <div id="user-menu" class="user-menu">
              <div class="user-info">
                <img id="user-avatar-large" src="/assets/favicon.svg" alt="Usuario" class="user-avatar-large">
                <div class="user-details">
                  <div id="user-name" class="user-name">Usuario</div>
                  <div id="user-email" class="user-email">usuario@gmail.com</div>
                </div>
                <button id="theme-toggle" class="theme-toggle" title="Cambiar tema">
                  <svg class="theme-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>
                  </svg>
                </button>
              </div>
              <div class="user-menu-separator"></div>
              <button id="logout-btn" class="user-menu-logout">
                <svg class="logout-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 12v3a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5v-3"/>
                  <polyline points="16 8 20 12 16 16"/>
                  <line x1="20" y1="12" x2="10" y2="12"/>
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Función auxiliar para agregar nuevos proyectos fácilmente
  static addProjectToList(projectId) {
    console.log(`[ProjectsConfig] Para agregar el proyecto '${projectId}':`);
    console.log(`1. Crear carpeta: projects/${projectId}/`);
    console.log(`2. Crear archivo: projects/${projectId}/config.json`);
    console.log(`3. Crear carpeta: projects/${projectId}/img/`);
    console.log(`4. Crear archivo: projects/${projectId}/img/logo.svg`);
    console.log(`5. Agregar entrada en /projects/projects.json`);
  }
}
