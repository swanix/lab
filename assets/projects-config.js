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
            <img src="/favicon.svg" alt="Logo" class="logo-img">
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
            <div id="logout-container">
              <button id="logout-btn">
                <span>•</span>
                Cerrar Sesión
              </button>
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
          <div id="logout-container">
            <button id="logout-btn">
              <span>•</span>
              Cerrar Sesión
            </button>
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
