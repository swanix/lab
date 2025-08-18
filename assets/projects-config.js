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
      document.body.innerHTML = `
        <div class="forbidden-container">
          <div class="logo">•</div>
          <h1>Proyecto no encontrado</h1>
          <p>El proyecto <strong>${projectId}</strong> no existe o no está disponible.</p>
          <div class="error-details">
            <h3>Proyectos disponibles:</h3>
            <p>Verifica que el proyecto esté correctamente configurado en el sistema.</p>
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
    
    // Si la ruta es /project-01/, retornar project-01
    if (segments.length > 0 && segments[0].startsWith('project-')) {
      return segments[0];
    }
    
    return null;
  }

  static async getAllProjects() {
    try {
      console.log('[ProjectsConfig] Cargando lista de proyectos disponibles...');
      
      // Lista de proyectos conocidos (se puede expandir dinámicamente)
      // En el futuro, esto podría ser detectado automáticamente desde el servidor
      const knownProjects = ['project-01', 'project-02', 'project-03'];
      const projects = [];
      
      // Verificar cada proyecto conocido
      for (const projectId of knownProjects) {
        try {
          const config = await this.loadProjectConfig(projectId);
          projects.push({
            id: projectId,
            title: config.title,
            description: config.description || `Proyecto ${projectId}`,
            url: `/${projectId}/`
          });
          console.log(`[ProjectsConfig] Proyecto ${projectId} cargado:`, config.title);
        } catch (error) {
          console.warn(`[ProjectsConfig] Proyecto ${projectId} no disponible:`, error.message);
          // No agregar proyectos que no existen
        }
      }
      
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
          <div id="logout-container">
            <button id="logout-btn">
              <span>•</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      `;
    }

    const projectsHTML = projects.map(project => `
      <a href="${project.url}" class="project-card">
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
        <div id="logout-container">
          <button id="logout-btn">
            <span>•</span>
            Cerrar Sesión
          </button>
        </div>
      </div>
    `;
  }
}
