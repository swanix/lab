# 🔐 Configuración de Auth0 para XDiagrams

## 📋 Configuración en Auth0 Dashboard

### 1. Crear Aplicación
- Ve a **Applications** → **Create Application**
- Nombre: `XDiagrams App`
- Tipo: **Single Page Application**

### 2. Configurar URLs
En **Settings** de tu aplicación:

- **Allowed Callback URLs**: `https://swanix-lab.netlify.app/api/auth/callback`
- **Allowed Logout URLs**: `https://swanix-lab.netlify.app`
- **Allowed Web Origins**: `https://swanix-lab.netlify.app`

### 3. Configurar Social Connections
- Ve a **Authentication** → **Social**
- Habilita **Google**
- Configura con tu Google OAuth Client ID y Secret

### 4. Variables de Entorno
En Netlify Dashboard → **Environment Variables**:

```
AUTH0_SECRET = "tu-secret-de-auth0"
AUTH0_BASE_URL = "https://swanix-lab.netlify.app"
AUTH0_DOMAIN = "tu-tenant.auth0.com"
AUTH0_CLIENT_ID = "tu-client-id"
AUTH0_CLIENT_SECRET = "tu-client-secret"
ALLOWED_ORIGIN = "https://swanix-lab.netlify.app"
```

## ✅ Verificación
1. Accede a tu sitio
2. Deberías ver la página de login
3. Al hacer clic en "Iniciar sesión con Google" deberías ir a Google
4. Después del login deberías regresar a tu aplicación

## 🔧 Troubleshooting
- Verifica que todas las URLs en Auth0 coincidan exactamente
- Asegúrate de que las variables de entorno estén configuradas en Netlify
- Revisa los logs en Netlify Functions para errores
