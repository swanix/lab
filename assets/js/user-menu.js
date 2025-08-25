// UserMenu.js - Sistema de menú de usuario reutilizable

class UserMenu {
  constructor() {
    this.userMenuTrigger = null;
    this.userMenu = null;
    this.themeToggle = null;
    this.logoutBtn = null;
    this.userAvatar = null;
    this.userAvatarLarge = null;
    this.userName = null;
    this.userEmail = null;
    this.themeIcon = null;
  }

  // Inicializar el menú de usuario
  init() {
    this.createUserMenuHTML();
    this.setupEventListeners();
    this.loadUserInfo();
    this.loadTheme();
    console.log('[UserMenu] Menú de usuario inicializado');
  }

  // Crear el HTML del menú de usuario
  createUserMenuHTML() {
    const headerControls = document.getElementById('header-controls');
    if (!headerControls) {
      console.error('[UserMenu] No se encontró el elemento header-controls');
      return;
    }

    // Crear el HTML del menú de usuario
    const userMenuHTML = `
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
    `;

    // Insertar el menú después del botón de aplicaciones
    const appsBtn = headerControls.querySelector('#apps-btn');
    if (appsBtn) {
      appsBtn.insertAdjacentHTML('afterend', userMenuHTML);
    } else {
      // Si no hay botón de aplicaciones, insertar al final
      headerControls.insertAdjacentHTML('beforeend', userMenuHTML);
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    this.userMenuTrigger = document.getElementById('user-menu-trigger');
    this.userMenu = document.getElementById('user-menu');
    this.themeToggle = document.getElementById('theme-toggle');
    this.logoutBtn = document.getElementById('logout-btn');
    this.themeIcon = document.querySelector('.theme-icon');

    // Toggle del menú
    if (this.userMenuTrigger && this.userMenu) {
      this.userMenuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.userMenu.classList.toggle('show');
      });
      
      // Cerrar menú al hacer clic fuera
      document.addEventListener('click', () => {
        this.userMenu.classList.remove('show');
      });
      
      // Evitar que se cierre al hacer clic dentro del menú
      this.userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
    
    // Toggle de tema
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // Logout
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', async () => {
        await this.handleLogout();
      });
    }
  }

  // Cargar información del usuario
  loadUserInfo() {
    try {
      const sessionData = localStorage.getItem('session_data');
      if (sessionData) {
        const user = JSON.parse(sessionData).user;
        
        this.userAvatar = document.getElementById('user-avatar');
        this.userAvatarLarge = document.getElementById('user-avatar-large');
        this.userName = document.getElementById('user-name');
        this.userEmail = document.getElementById('user-email');
        
        // Actualizar avatar
        if (user.picture) {
          if (this.userAvatar) this.userAvatar.src = user.picture;
          if (this.userAvatarLarge) this.userAvatarLarge.src = user.picture;
        }
        
        // Actualizar nombre
        if (this.userName && user.name) {
          this.userName.textContent = user.name;
        }
        
        // Actualizar email
        if (this.userEmail && user.email) {
          this.userEmail.textContent = user.email;
        }
      }
    } catch (error) {
      console.error('[UserMenu] Error cargando información del usuario:', error);
    }
  }

  // Cargar tema guardado
  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    
    if (savedTheme === 'light') {
      body.classList.add('light-mode');
      this.updateThemeIcon('light');
    }
  }

  // Cambiar tema
  toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('light-mode')) {
      // Cambiar a dark mode
      body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      this.updateThemeIcon('dark');
    } else {
      // Cambiar a light mode
      body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      this.updateThemeIcon('light');
    }
  }

  // Actualizar ícono del tema
  updateThemeIcon(theme) {
    if (!this.themeIcon) return;

    if (theme === 'light') {
      this.themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
      this.themeIcon.innerHTML = '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>';
    }
  }

  // Manejar logout
  async handleLogout() {
    try {
      console.log('[UserMenu] Iniciando logout...');
      
      // Limpiar datos de sesión local
      localStorage.removeItem('session_data');
      localStorage.removeItem('session_token');
      localStorage.removeItem('session_expires');
      
      // Redirigir a logout del servidor
      window.location.href = '/api/logout';
      
    } catch (error) {
      console.error('[UserMenu] Error en logout:', error);
      // Redirigir de todas formas
      window.location.href = '/api/logout';
    }
  }
}

// Exportar para uso global
window.UserMenu = UserMenu;
