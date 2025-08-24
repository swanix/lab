# 🔐 Sistema de Autenticación Modular

Este es un sistema de autenticación plug & play basado en Auth0 que puede ser integrado fácilmente en cualquier proyecto.

## 📁 Estructura

```
auth/
├── assets/
│   ├── auth-config.js    # Configuración centralizada
│   ├── auth.js          # Lógica principal de autenticación
│   └── auth.css         # Estilos específicos de auth
├── pages/
│   ├── login.html       # Página de login
│   └── forbidden.html   # Página de acceso denegado
├── functions/           # Netlify functions
│   ├── auth.js
│   ├── auth-callback.js
│   ├── check-auth.js
│   └── logout.js
└── README.md           # Esta documentación
```

## 🚀 Integración Rápida

### 1. Copiar la carpeta `auth/`

```bash
cp -r auth/ tu-proyecto/
```

### 2. Configurar variables de entorno

En tu dashboard de Netlify, configura las siguientes variables:

```env
# Auth0 Configuration
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu-client-id
AUTH0_CLIENT_SECRET=tu-client-secret
AUTH0_CALLBACK_URL=https://tu-dominio.netlify.app/api/auth/callback

# Allowed Users (emails separados por comas)
ALLOWED_USERS=usuario1@gmail.com,usuario2@gmail.com

# JWT Secret (generar uno aleatorio)
JWT_SECRET=tu-jwt-secret-super-seguro

# API Proxy (opcional - para acceso a datos protegidos)
API_PROXY_KEY=tu-api-key
API_PROXY_ALLOWED_DOMAINS=api.sheetbest.com,api.otroservicio.com
API_PROXY_SERVICE_NAME=SheetBest
```

### 3. Actualizar `netlify.toml`

```toml
[build]
  functions = "auth/functions"
  publish = "."

[[redirects]]
  from = "/api/auth/login"
  to = "/.netlify/functions/auth"
  status = 200

[[redirects]]
  from = "/api/auth/callback"
  to = "/.netlify/functions/auth-callback"
  status = 200

[[redirects]]
  from = "/api/logout"
  to = "/.netlify/functions/logout"
  status = 200

[[redirects]]
  from = "/api/proxy"
  to = "/.netlify/functions/api-proxy"
  status = 200

[[redirects]]
  from = "/login"
  to = "/auth/pages/login.html"
  status = 200

[[redirects]]
  from = "/forbidden"
  to = "/auth/pages/forbidden.html"
  status = 200

### 4. Incluir en tu `index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <!-- ... otros elementos ... -->
  
  <!-- Cargar configuración de auth primero -->
  <script src="/auth/assets/auth-config.js"></script>
  
  <!-- Cargar sistema de autenticación -->
  <script src="/auth/assets/auth.js"></script>
</head>
<body>
  <!-- Tu contenido aquí -->
  
  <!-- Opcional: Botón de logout -->
  <div id="logout-container" style="display: none;">
    <button id="logout-btn">Cerrar sesión</button>
  </div>
  
  <script>
    // Configurar logout si es necesario
    Auth.setupLogout();
  </script>
</body>
</html>
```

## ⚙️ Configuración Personalizada

### Modificar `auth/assets/auth-config.js`

```javascript
window.AUTH_CONFIG = {
  // Rutas de la API
  endpoints: {
    login: '/api/auth/login',
    callback: '/api/auth/callback',
    logout: '/api/logout',
    checkAuth: '/.netlify/functions/check-auth'
  },
  
  // Proxy de API opcional (para acceso a datos protegidos)
  apiProxy: {
    enabled: true, // Cambiar a true para habilitar
    endpoint: '/api/proxy',
    serviceName: 'SheetBest', // Nombre del servicio
    allowedDomains: ['api.sheetbest.com'] // Dominios permitidos
  },
  
  // Rutas de las páginas
  pages: {
    login: '/auth/pages/login.html',
    forbidden: '/auth/pages/forbidden.html'
  },
  
  // Configuración de la aplicación
  app: {
    name: 'Mi Aplicación',           // Cambiar nombre
    logo: '/assets/logo.svg',        // Cambiar logo
    allowedDomains: ['gmail.com'],   // Dominios permitidos
    redirectAfterLogin: '/'          // Página después del login
  },
  
  // Configuración de debug
  debug: {
    enabled: false,  // Cambiar a false en producción
    prefix: '[Auth]'
  }
};
```

## 🔧 API del Sistema

### Funciones Disponibles

```javascript
// Verificar autenticación (automático)
Auth.checkAuthentication()

// Limpiar sesión
Auth.clearSession()

// Redirigir al login
Auth.redirectToLogin()

// Redirigir a forbidden
Auth.redirectToForbidden('motivo')

// Configurar botón de logout
Auth.setupLogout()

// Verificar dominio permitido
Auth.isAllowedDomain('usuario@gmail.com')

// Obtener datos del usuario
const userData = Auth.getUserData()

// Verificar si está autenticado
const isAuth = Auth.isAuthenticated()

// Acceder a datos protegidos (si el proxy está habilitado)
const data = await Auth.fetchProtectedData('https://api.sheetbest.com/...')
```

### Ejemplo de Uso

```javascript
// Verificar si el usuario está autenticado
if (Auth.isAuthenticated()) {
  const user = Auth.getUserData();
  console.log('Usuario:', user.user.email);
  
  // Mostrar contenido protegido
  document.getElementById('protected-content').style.display = 'block';
} else {
  // Redirigir al login
  Auth.redirectToLogin();
}
```

## 🎨 Personalización de Estilos

Los estilos están en `auth/assets/auth.css` y usan variables CSS para fácil personalización:

```css
:root {
  --color-bg-primary: #0f0f0f;
  --color-bg-secondary: #1a1a1a;
  --color-text-primary: #ffffff;
  --color-info: #3b82f6;
  /* ... más variables ... */
}
```

## 🔒 Seguridad

- ✅ Solo permite cuentas de Gmail
- ✅ Verificación de usuarios autorizados
- ✅ Tokens JWT seguros
- ✅ Sesiones con expiración
- ✅ Headers de seguridad configurados

## 🐛 Debug

Para habilitar logs de debug, cambiar en `auth-config.js`:

```javascript
debug: {
  enabled: true,  // Cambiar a true para debug
  prefix: '[Auth]'
}
```

## 📝 Notas Importantes

1. **Auth0 Setup**: Necesitas configurar una aplicación en Auth0 con Google como proveedor
2. **Dominios Permitidos**: Por defecto solo permite `@gmail.com`
3. **Variables de Entorno**: Todas las variables deben estar configuradas en Netlify
4. **Rutas**: Las rutas están configuradas para funcionar con Netlify Functions

## 🆘 Solución de Problemas

### Error: "AUTH_CONFIG no está definido"
- Asegúrate de cargar `auth-config.js` antes que `auth.js`

### Error: "Usuario no autorizado"
- Verifica que el email esté en `ALLOWED_USERS`
- Asegúrate de que sea un dominio permitido

### Error: "Sesión expirada"
- Las sesiones expiran automáticamente
- El usuario será redirigido al login

### Error: "Auth0 callback failed"
- Verifica que `AUTH0_CALLBACK_URL` esté configurado correctamente
- Asegúrate de que el dominio esté permitido en Auth0
