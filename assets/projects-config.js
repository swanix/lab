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
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 90%;
          ">
            <h1 style="
              color: #333;
              font-size: 1.8rem;
              font-weight: 600;
              margin-bottom: 20px;
            ">Proyecto no encontrado</h1>
            <p style="
              color: #666;
              font-size: 1rem;
              line-height: 1.5;
              margin-bottom: 15px;
            ">El proyecto <strong>${projectId}</strong> no existe o no está disponible.</p>
            <p style="
              color: #888;
              font-size: 0.9rem;
              margin-bottom: 30px;
            ">Proyectos disponibles: <strong>project-01</strong>, <strong>project-02</strong></p>
            <a href="/" style="
              color: #007bff;
              text-decoration: none;
              padding: 12px 24px;
              border: 2px solid #007bff;
              border-radius: 6px;
              display: inline-block;
              font-weight: 500;
              transition: all 0.2s ease;
            " onmouseover="this.style.background='#007bff'; this.style.color='white'" onmouseout="this.style.background='transparent'; this.style.color='#007bff'">← Volver al inicio</a>
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
}
