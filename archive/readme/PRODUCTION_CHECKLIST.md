# ✅ Checklist de Producción - XDiagrams

## 🔐 Configuración de Auth0

### Configuración en Auth0 Dashboard
- [ ] Crear aplicación tipo "Single Page Application"
- [ ] Configurar Google como proveedor de identidad
- [ ] Allowed Callback URLs: `https://swanix-lab.netlify.app/api/auth/callback`
- [ ] Allowed Logout URLs: `https://swanix-lab.netlify.app`
- [ ] Allowed Web Origins: `https://swanix-lab.netlify.app`

### Variables de Entorno en Auth0
- [ ] AUTH0_SECRET (generar con crypto.randomBytes(32))
- [ ] AUTH0_DOMAIN (tu-tenant.auth0.com)
- [ ] AUTH0_CLIENT_ID (desde Auth0 Dashboard)
- [ ] AUTH0_CLIENT_SECRET (desde Auth0 Dashboard)

## 🌐 Configuración de Netlify

### Variables de Entorno
- [ ] Obtener URL del sitio: `https://swanix-lab.netlify.app`
- [ ] Configurar en Site Settings → Environment Variables:

```
AUTH0_SECRET = "tu-secret-de-auth0"
AUTH0_BASE_URL = "https://swanix-lab.netlify.app"
AUTH0_DOMAIN = "tu-tenant.auth0.com"
AUTH0_CLIENT_ID = "tu-client-id"
AUTH0_CLIENT_SECRET = "tu-client-secret"
SHEETBEST_API_KEY = "tu-api-key-de-sheetbest"
ALLOWED_ORIGIN = "https://swanix-lab.netlify.app"
```

### Configuración de CORS
- [ ] Reemplazar `your-site.netlify.app` con tu URL real
- [ ] Verificar headers en `netlify.toml`
- [ ] Probar funciones de Netlify

## 🔧 Configuración de SheetBest

### API Key
- [ ] Obtener API key en [sheet.best](https://sheet.best)
- [ ] Configurar en variables de entorno de Netlify
- [ ] Probar conexión con tu Google Sheet

### Configuración de Google Sheets
- [ ] Compartir Google Sheet con la API key
- [ ] Verificar permisos de lectura
- [ ] Probar acceso desde la aplicación

## 🚀 Despliegue

### Verificación Final
- [ ] Commit y push de todos los cambios
- [ ] Deploy automático en Netlify
- [ ] Acceder a `https://swanix-lab.netlify.app`
- [ ] Probar flujo de autenticación completo
- [ ] Verificar que el diagrama se carga correctamente
- [ ] Probar logout y redirección

### Monitoreo
- [ ] Revisar logs en Netlify Functions
- [ ] Verificar métricas de uso
- [ ] Configurar alertas si es necesario

## ✅ Listo para Producción

¡Tu aplicación XDiagrams está lista para uso en producción!
