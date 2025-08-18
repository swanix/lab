# 🔐 Configuración de Auth0 con Google para Netlify

## 📋 Pasos para configurar la autenticación

### 1. Crear cuenta en Auth0
1. Ve a [auth0.com](https://auth0.com) y crea una cuenta
2. Crea una nueva aplicación
3. Selecciona "Single Page Application" como tipo

### 2. Configurar Google como proveedor de identidad
1. En el dashboard de Auth0, ve a "Authentication" > "Social"
2. Habilita Google
3. Configura las credenciales de Google OAuth:
   - Client ID de Google
   - Client Secret de Google
4. Guarda la configuración

### 3. Configurar la aplicación en Auth0
1. En tu aplicación de Auth0, configura:
   - **Allowed Callback URLs**: `https://tu-sitio.netlify.app/api/auth/callback`
   - **Allowed Logout URLs**: `https://tu-sitio.netlify.app`
   - **Allowed Web Origins**: `https://tu-sitio.netlify.app`

### 4. Configurar variables de entorno en Netlify
En el dashboard de Netlify, ve a Site settings > Environment variables y agrega:

```
AUTH0_SECRET = "tu-secret-aleatorio-de-32-caracteres"
AUTH0_BASE_URL = "https://tu-sitio.netlify.app"
AUTH0_ISSUER_BASE_URL = "https://tu-tenant.auth0.com"
AUTH0_CLIENT_ID = "tu-client-id-de-auth0"
AUTH0_CLIENT_SECRET = "tu-client-secret-de-auth0"
SHEETBEST_API_KEY = "tu-api-key-de-sheetbest"
```

### 5. Generar AUTH0_SECRET
Ejecuta este comando para generar un secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Configurar reglas de Auth0 (opcional)
Para restringir solo emails de Google, crea una regla en Auth0:

```javascript
function (user, context, callback) {
  // Solo permitir emails de Google
  if (!user.email || !user.email.endsWith('@gmail.com')) {
    return callback(new UnauthorizedError('Solo se permiten cuentas de Google'));
  }
  
  callback(null, user, context);
}
```

## 🔄 Flujo de autenticación

1. **Usuario visita el sitio** → Redirigido a `/login.html`
2. **Hace clic en "Iniciar sesión"** → Redirigido a Auth0
3. **Se autentica con Google** → Auth0 verifica las credenciales
4. **Auth0 redirige de vuelta** → Al callback de Netlify
5. **Función de Auth0 procesa** → Crea la sesión
6. **Usuario accede al diagrama** → Verificación automática de autenticación

## 🛡️ Seguridad implementada

- ✅ **Autenticación obligatoria** antes de acceder al diagrama
- ✅ **Solo emails de Google** (@gmail.com) permitidos
- ✅ **API Key protegida** en variables de entorno de Netlify
- ✅ **Sesiones seguras** manejadas por Auth0
- ✅ **Logout automático** con redirección segura

## 🚀 Despliegue

1. Haz commit de todos los cambios
2. Push a tu repositorio
3. Netlify detectará los cambios y desplegará automáticamente
4. Configura las variables de entorno en el dashboard de Netlify
5. ¡Listo! Tu diagrama ahora requiere autenticación con Google

## 🔧 Troubleshooting

### Error: "Only absolute URLs are supported"
- Verifica que las URLs en `netlify.toml` sean correctas
- Asegúrate de que el dominio de tu sitio esté bien configurado

### Error: "API Key no configurada"
- Verifica que `SHEETBEST_API_KEY` esté configurada en Netlify
- Asegúrate de que la variable esté en el contexto correcto (production)

### Error: "Usuario no autenticado"
- Verifica que las variables de Auth0 estén configuradas correctamente
- Revisa los logs de las funciones de Netlify para más detalles
