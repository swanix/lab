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
      // Mostrar página de error
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h1>❌ Proyecto no encontrado</h1>
          <p>El proyecto <strong>${projectId}</strong> no existe o no está disponible.</p>
          <p style="color: #666; font-size: 0.9em;">Proyectos disponibles: project-01, project-02</p>
          <a href="/" style="color: #007bff; text-decoration: none; padding: 10px 20px; border: 1px solid #007bff; border-radius: 5px; display: inline-block; margin-top: 20px;">← Volver al inicio</a>
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
}
