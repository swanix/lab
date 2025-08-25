# 🔧 Documentación Técnica: Implementación SPA

## 📋 Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Implementación del Router](#implementación-del-router)
3. [Gestión de Estado](#gestión-de-estado)
4. [Interceptación de Eventos](#interceptación-de-eventos)
5. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
6. [Compatibilidad y Fallbacks](#compatibilidad-y-fallbacks)
7. [Testing y Debugging](#testing-y-debugging)

## 🏗️ Arquitectura del Sistema

### **Diagrama de Componentes**

```
┌─────────────────────────────────────────────────────────────┐
│                    AppRouter (SPA)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Event Interceptor│  │ State Manager   │  │ URL Manager  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Loading Manager │  │ Navigation      │  │ History API  │ │
│  │                 │  │ Controller      │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AppsConfig                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Project Loader  │  │ Config Manager  │  │ Grid Generator│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Flujo de Datos**

```
1. Usuario hace clic → Event Interceptor
2. Event Interceptor → State Manager (verificar navegación)
3. State Manager → Loading Manager (mostrar spinner)
4. Loading Manager → Navigation Controller (cargar contenido)
5. Navigation Controller → AppsConfig (obtener datos)
6. AppsConfig → URL Manager (actualizar URL)
7. URL Manager → Loading Manager (ocultar spinner)
```

## 🚀 Implementación del Router

### **Clase AppRouter**

```javascript
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
}
```

### **Inicialización del Router**

```javascript
async init() {
  try {
    // 1. Verificar autenticación
    const isAuthenticated = await checkAuthForProtectedPage();
    
    if (!isAuthenticated) {
      return; // Redirección manejada por checkAuthForProtectedPage
    }
    
    // 2. Configurar elementos DOM
    this.setupDOMElements();
    
    // 3. Determinar ruta inicial
    const projectId = AppsConfig.getProjectIdFromPath();
    
    if (projectId) {
      await this.loadProject(projectId);
    } else {
      await this.showDashboard();
    }
    
    // 4. Configurar navegación SPA
    this.setupHeaderControls();
    this.setupSPANavigation();
    
    // 5. Finalizar inicialización
    document.body.classList.remove('loading');
    
  } catch (error) {
    console.error('[AppRouter] Error inicializando router:', error);
    document.body.classList.remove('loading');
  }
}
```

## 🎛️ Gestión de Estado

### **Variables de Estado**

```javascript
class AppRouter {
  // Estado de navegación
  isNavigating = false;
  currentProjectId = null;
  
  // Referencias DOM
  container = null;
  headerControls = null;
  appsBtn = null;
  userMenu = null;
}
```

### **Prevención de Navegación Múltiple**

```javascript
async loadProject(projectId) {
  // Verificar si ya hay una navegación en progreso
  if (this.isNavigating) {
    console.log('[AppRouter] Navegación en progreso, ignorando...');
    return;
  }
  
  // Marcar inicio de navegación
  this.isNavigating = true;
  this.currentProjectId = projectId;
  
  try {
    // Realizar navegación...
    await this.performNavigation(projectId);
  } finally {
    // Marcar fin de navegación
    this.isNavigating = false;
  }
}
```

## 🎯 Interceptación de Eventos

### **Event Delegation**

```javascript
setupSPANavigation() {
  document.addEventListener('click', async (event) => {
    const appCard = event.target.closest('.app-card');
    
    if (appCard && !this.isNavigating) {
      event.preventDefault();
      event.stopPropagation();
      
      // Extraer información del proyecto
      const projectUrl = appCard.getAttribute('data-project-url') || 
                        this.extractProjectUrlFromOnclick(appCard);
      
      if (projectUrl) {
        const projectId = this.extractProjectIdFromUrl(projectUrl);
        if (projectId) {
          await this.navigateToProjectSPA(projectId);
        }
      }
    }
  });
}
```

### **Extracción de Datos**

```javascript
extractProjectIdFromUrl(url) {
  const match = url.match(/\/([^\/]+)\/?$/);
  return match ? match[1] : null;
}

extractProjectUrlFromOnclick(element) {
  const onclickStr = element.onclick?.toString();
  const match = onclickStr?.match(/window\.location\.href='([^']+)'/);
  return match ? match[1] : null;
}
```

## ⚡ Optimizaciones de Rendimiento

### **Indicadores de Carga**

```javascript
showLoadingIndicator() {
  if (this.container) {
    this.container.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    `;
  }
}

hideLoadingIndicator() {
  // El contenido se reemplazará automáticamente
  // No necesitamos hacer nada aquí
}
```

### **Generación de Grid Optimizada**

```javascript
generateAppsGridWithSPA(apps) {
  if (!apps || apps.length === 0) {
    return this.generateEmptyState();
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

  return `<div class="apps-grid">${appsHTML}</div>`;
}
```

## 🔄 Compatibilidad y Fallbacks

### **Métodos Legacy**

```javascript
// Métodos de navegación tradicional (para compatibilidad)
navigateToProject(projectId) {
  if (projectId) {
    window.location.href = `/${projectId}/`;
  }
}

navigateToDashboard() {
  window.location.href = '/app/';
}
```

### **Manejo de History API**

```javascript
updateURL(path, projectId) {
  const newUrl = window.location.origin + path;
  
  try {
    window.history.pushState({ projectId }, '', newUrl);
    console.log(`[AppRouter] URL actualizada: ${newUrl}`);
  } catch (error) {
    console.warn('[AppRouter] Error actualizando URL, usando fallback:', error);
    // Fallback: actualizar URL sin pushState
    window.location.pathname = path;
  }
}
```

### **Manejo de Popstate**

```javascript
// Agregar listener para botón atrás/adelante
window.addEventListener('popstate', (event) => {
  const projectId = event.state?.projectId;
  
  if (projectId) {
    this.loadProject(projectId);
  } else {
    this.showDashboard();
  }
});
```

## 🧪 Testing y Debugging

### **Logging Detallado**

```javascript
// Logs para debugging
console.log('[AppRouter] Inicializando router...');
console.log(`[AppRouter] Cargando proyecto: ${projectId}`);
console.log('[AppRouter] Navegación en progreso, ignorando...');
console.log(`[AppRouter] URL actualizada: ${newUrl}`);
```

### **Casos de Prueba**

#### **Navegación Básica**
```javascript
// Test: Navegación a proyecto
const router = new AppRouter();
await router.navigateToProjectSPA('project-01');
assert(router.currentProjectId === 'project-01');
assert(window.location.pathname === '/project-01/');
```

#### **Prevención de Navegación Múltiple**
```javascript
// Test: Prevención de clicks múltiples
const router = new AppRouter();
router.isNavigating = true;

// Segundo click debería ser ignorado
await router.navigateToProjectSPA('project-02');
assert(router.currentProjectId !== 'project-02');
```

#### **Manejo de Errores**
```javascript
// Test: Manejo de errores
const router = new AppRouter();
try {
  await router.loadProject('proyecto-inexistente');
} catch (error) {
  assert(error.message.includes('Error cargando'));
  assert(router.isNavigating === false);
}
```

### **Herramientas de Debugging**

#### **Estado del Router**
```javascript
// Función para inspeccionar estado
getRouterState() {
  return {
    isNavigating: this.isNavigating,
    currentProjectId: this.currentProjectId,
    containerExists: !!this.container,
    headerControlsExists: !!this.headerControls,
    appsBtnExists: !!this.appsBtn
  };
}
```

#### **Métricas de Rendimiento**
```javascript
// Medición de tiempo de navegación
async measureNavigationTime(projectId) {
  const startTime = performance.now();
  await this.navigateToProjectSPA(projectId);
  const endTime = performance.now();
  
  console.log(`[AppRouter] Tiempo de navegación: ${endTime - startTime}ms`);
  return endTime - startTime;
}
```

## 📊 Métricas y Monitoreo

### **Métricas Clave**

```javascript
class NavigationMetrics {
  constructor() {
    this.navigationTimes = [];
    this.errorCount = 0;
    this.successCount = 0;
  }
  
  recordNavigation(duration, success) {
    this.navigationTimes.push(duration);
    
    if (success) {
      this.successCount++;
    } else {
      this.errorCount++;
    }
  }
  
  getAverageNavigationTime() {
    if (this.navigationTimes.length === 0) return 0;
    return this.navigationTimes.reduce((a, b) => a + b, 0) / this.navigationTimes.length;
  }
  
  getSuccessRate() {
    const total = this.successCount + this.errorCount;
    return total > 0 ? (this.successCount / total) * 100 : 0;
  }
}
```

### **Eventos Personalizados**

```javascript
// Disparar eventos para monitoreo
dispatchNavigationEvent(type, data) {
  const event = new CustomEvent('app-navigation', {
    detail: {
      type,
      timestamp: Date.now(),
      ...data
    }
  });
  
  document.dispatchEvent(event);
}

// Ejemplo de uso
this.dispatchNavigationEvent('project-loaded', {
  projectId: 'project-01',
  duration: 250
});
```

## 🔮 Optimizaciones Futuras

### **Precarga de Proyectos**

```javascript
// Precargar proyectos en background
async preloadProjects() {
  const apps = await AppsConfig.getAllApps();
  
  for (const app of apps) {
    const projectId = this.extractProjectIdFromUrl(app.url);
    if (projectId) {
      // Precargar configuración sin mostrar
      AppsConfig.loadProjectConfig(projectId).catch(() => {});
    }
  }
}
```

### **Cache de Configuraciones**

```javascript
class ConfigCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutos
  }
  
  async get(projectId) {
    const cached = this.cache.get(projectId);
    
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.data;
    }
    
    const data = await AppsConfig.loadProjectConfig(projectId);
    this.cache.set(projectId, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

---

**Versión**: 1.0.0  
**Última Actualización**: 2024-12-25  
**Autor**: Equipo de Desarrollo  
**Estado**: ✅ Documentación Completada
