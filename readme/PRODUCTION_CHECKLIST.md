# 🚀 Checklist de Producción - XDiagrams

## 📋 Pasos para Despliegue a Producción

### 🔧 1. Configuración de Auth0

- [ ] **Crear aplicación en Auth0**
  - [ ] Ir a [auth0.com](https://auth0.com)
  - [ ] Crear nueva aplicación "Single Page Application"
  - [ ] Configurar Google como proveedor de identidad
  - [ ] Obtener credenciales de Google OAuth

- [ ] **Configurar URLs en Auth0**
  - [ ] Allowed Callback URLs: `https://tu-sitio.netlify.app/api/auth/callback`
  - [ ] Allowed Logout URLs: `https://tu-sitio.netlify.app`
  - [ ] Allowed Web Origins: `https://tu-sitio.netlify.app`

- [ ] **Obtener credenciales de Auth0**
  - [ ] Domain: `tu-tenant.auth0.com`
  - [ ] Client ID: `tu-client-id`
  - [ ] Client Secret: `tu-client-secret`

### 🔑 2. Generar Secret de Auth0

```bash
# Ejecutar en terminal para generar secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 🌐 3. Configurar Netlify

- [ ] **Crear sitio en Netlify**
  - [ ] Conectar repositorio de GitHub
  - [ ] Configurar build settings
  - [ ] Obtener URL del sitio: `https://tu-sitio.netlify.app`

- [ ] **Configurar variables de entorno**
  - [ ] Ir a Site settings → Environment variables
  - [ ] Agregar todas las variables:

```bash
AUTH0_SECRET = "tu-secret-generado-en-paso-2"
AUTH0_BASE_URL = "https://tu-sitio.netlify.app"
AUTH0_DOMAIN = "tu-tenant.auth0.com"
AUTH0_CLIENT_ID = "tu-client-id-de-auth0"
AUTH0_CLIENT_SECRET = "tu-client-secret-de-auth0"
SHEETBEST_API_KEY = "tu-api-key-de-sheetbest"
ALLOWED_ORIGIN = "https://tu-sitio.netlify.app"
```

### 🔄 4. Actualizar Configuración

- [ ] **Actualizar netlify.toml**
  - [ ] Reemplazar `your-site.netlify.app` con tu URL real
  - [ ] Reemplazar `your-tenant.auth0.com` con tu dominio Auth0

- [ ] **Actualizar index.html**
  - [ ] Verificar que la URL del proxy es correcta
  - [ ] Confirmar que pasa la sesión correctamente

### 🧪 5. Testing

- [ ] **Probar autenticación**
  - [ ] Acceder a `https://tu-sitio.netlify.app`
  - [ ] Verificar redirección a login
  - [ ] Probar login con Google
  - [ ] Verificar acceso al diagrama

- [ ] **Probar seguridad**
  - [ ] Intentar acceder sin autenticación
  - [ ] Probar con email no @gmail.com
  - [ ] Verificar rate limiting
  - [ ] Revisar logs de seguridad

- [ ] **Probar funcionalidad**
  - [ ] Verificar que el diagrama carga correctamente
  - [ ] Probar logout
  - [ ] Verificar que la sesión expira correctamente

### 📊 6. Monitoreo

- [ ] **Configurar logs**
  - [ ] Revisar logs de Netlify Functions
  - [ ] Monitorear eventos de seguridad
  - [ ] Configurar alertas si es necesario

- [ ] **Verificar métricas**
  - [ ] Tiempo de respuesta
  - [ ] Tasa de errores
  - [ ] Uso de rate limiting

### 🔒 7. Seguridad Final

- [ ] **Verificar headers de seguridad**
  - [ ] X-Frame-Options: DENY
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Content-Security-Policy configurado
  - [ ] CORS restrictivo

- [ ] **Verificar protección escalonada**
  - [ ] Sin autenticación → Bloqueado
  - [ ] Sin email @gmail.com → Bloqueado
  - [ ] Sin sesión válida → Bloqueado
  - [ ] API Key protegida → ✅

## 🎯 Comandos Útiles

### Generar secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Verificar configuración:
```bash
# Verificar que todas las funciones están presentes
ls -la netlify/functions/

# Verificar configuración de Netlify
cat netlify.toml
```

### Deploy manual:
```bash
# Si usas Netlify CLI
netlify deploy --prod

# O hacer push a GitHub para deploy automático
git add .
git commit -m "Deploy a producción con seguridad mejorada"
git push origin main
```

## 🚨 Troubleshooting

### Error: "AUTH0_SECRET no configurado"
- Verificar que la variable está en Netlify Dashboard
- Verificar que el valor tiene 64 caracteres hexadecimales

### Error: "CORS"
- Verificar que `ALLOWED_ORIGIN` coincide con tu dominio
- Verificar que no hay espacios extra en la URL

### Error: "Rate limit excedido"
- Esperar 15 minutos
- Verificar que no hay múltiples pestañas abiertas

### Error: "API Key no configurada"
- Verificar que `SHEETBEST_API_KEY` está en variables de entorno
- Verificar que la función proxy está desplegada

## ✅ Checklist de Verificación Final

- [ ] ✅ Login con Google funciona
- [ ] ✅ Solo emails @gmail.com permitidos
- [ ] ✅ Diagrama carga correctamente
- [ ] ✅ Logout funciona
- [ ] ✅ Rate limiting activo
- [ ] ✅ Logs de seguridad funcionando
- [ ] ✅ Headers de seguridad aplicados
- [ ] ✅ API Key protegida
- [ ] ✅ CORS configurado correctamente

---

**¡Listo para producción! 🚀**
