# AGENTS.md

## Descripción del Proyecto

Este es un template para usar **XDiagrams** con **APIs protegidas** implementando autenticación robusta con Google/Auth0. El proyecto incluye:

- Autenticación obligatoria con Google
- Protección escalonada (múltiples capas de verificación)
- Rate limiting (100 requests/15min por IP)
- API Key protegida (nunca expuesta al frontend)
- Logging de auditoría completo
- CORS restrictivo configurado

## Comandos de Configuración

### Instalación y Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Deploy en Netlify
npm run deploy
```

### Variables de Entorno Requeridas
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Variables necesarias para Auth0:
AUTH0_SECRET=tu-secret-aleatorio-de-32-caracteres
AUTH0_BASE_URL=https://tu-dominio.netlify.app
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu-client-id
AUTH0_CLIENT_SECRET=tu-client-secret

# Variables para APIs:
SHEETBEST_API_KEY=tu-api-key-de-sheetbest
ALLOWED_ORIGIN=https://lab.swanix.org
```

## Estructura del Código

### Archivos Principales
- `index.html` - Página principal con configuración de XDiagrams
- `netlify.toml` - Configuración de Netlify y redirecciones
- `auth/functions/` - Funciones serverless para autenticación y proxy
- `app/` - Directorio de aplicaciones con configuraciones
- `assets/apps-config.js` - Configuración centralizada de aplicaciones

### Funciones Serverless
- `auth.js` - Manejo de login
- `auth-callback.js` - Callback de autenticación
- `check-auth.js` - Verificación de autenticación
- `sheetbest-proxy.js` - Proxy autenticado para SheetBest
- `api-proxy.js` - Proxy genérico para APIs
- `logout.js` - Manejo de logout

## Guías de Estilo

### JavaScript
- Usar ES6+ features
- Preferir `const` y `let` sobre `var`
- Usar arrow functions donde sea apropiado
- Manejar errores con try/catch

### HTML
- Mantener estructura semántica
- Usar atributos de accesibilidad
- Validar formularios en frontend y backend

### Seguridad
- **NUNCA** exponer API keys en el frontend
- Validar todas las entradas de usuario
- Implementar rate limiting
- Usar HTTPS en producción
- Validar tokens JWT en cada request

## Instrucciones de Testing

### Verificar Autenticación
```bash
# Probar flujo de login
curl -X GET "https://tu-dominio.netlify.app/api/auth/login"

# Verificar callback
curl -X GET "https://tu-dominio.netlify.app/api/auth/callback?code=test"
```

### Verificar Proxy de APIs
```bash
# Probar proxy de SheetBest (requiere autenticación)
curl -X GET "https://tu-dominio.netlify.app/.netlify/functions/sheetbest-proxy" \
  -H "Authorization: Bearer tu-token-jwt"
```

### Verificar Seguridad
- Confirmar que las variables de entorno están configuradas en Netlify
- Verificar que CORS está restringido correctamente
- Comprobar que rate limiting funciona
- Validar que los headers de seguridad están presentes

### Verificar Aplicaciones
- Confirmar que `/app/apps.json` se carga correctamente
- Verificar que las aplicaciones se muestran en el grid
- Comprobar que los logos de las aplicaciones se cargan
- Validar que la navegación entre aplicaciones funciona

## Instrucciones para Pull Requests

### Formato del Título
```
[FEATURE] Agregar nueva funcionalidad de autenticación
[FIX] Corregir problema con proxy de SheetBest
[SECURITY] Mejorar validación de tokens JWT
```

### Checklist Antes de Commit
- [ ] Ejecutar `npm run dev` y verificar que funciona
- [ ] Verificar que las funciones serverless se despliegan correctamente
- [ ] Probar el flujo completo de autenticación
- [ ] Verificar que no hay API keys expuestas en el código
- [ ] Comprobar que los headers de seguridad están configurados

### Consideraciones de Seguridad
- **CRÍTICO**: Nunca commitear archivos `.env` o variables de entorno
- Verificar que todas las rutas están protegidas apropiadamente
- Validar que el rate limiting está funcionando
- Comprobar que los logs de auditoría están activos

### Consideraciones de Aplicaciones
- **CRÍTICO**: Verificar que las rutas `/app/*` están protegidas
- Validar que los archivos de configuración JSON son válidos
- Comprobar que los logos SVG se cargan correctamente
- Verificar que las URLs de las aplicaciones son válidas

## Configuración de Desarrollo

### Netlify Functions
Las funciones están en `auth/functions/` y se despliegan automáticamente a `/.netlify/functions/`.

### Redirecciones Configuradas
- `/api/auth/login` → `/.netlify/functions/auth`
- `/api/auth/callback` → `/.netlify/functions/auth-callback`
- `/api/logout` → `/.netlify/functions/logout`
- `/api/sheetbest-proxy` → `/.netlify/functions/sheetbest-proxy`

### Headers de Seguridad
- CSP configurado para permitir SheetBest
- CORS restringido a `https://lab.swanix.org`
- Headers de seguridad estándar habilitados

## Troubleshooting

### Error: "API Key no configurada"
- Verificar que `SHEETBEST_API_KEY` está en variables de entorno de Netlify
- Verificar que la función proxy está desplegada

### Error: "CORS"
- Verificar que `ALLOWED_ORIGIN` está configurada correctamente
- Verificar que la URL del proxy es correcta

### Error: "Rate limit excedido"
- Esperar 15 minutos antes de hacer más peticiones
- Verificar que no hay múltiples pestañas abiertas

### Error: "No autenticado"
- Verificar que las variables de Auth0 estén configuradas
- Verificar que el usuario tiene email @gmail.com

## Recursos Útiles

- [Documentación XDiagrams](https://github.com/swanix/diagrams)
- [SheetBest API](https://sheet.best/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Auth0 Documentation](https://auth0.com/docs)
- [AGENTS.md Standard](https://agents.md/)

## Notas Importantes

- Este proyecto usa autenticación obligatoria con Google
- Todas las APIs están protegidas a través de proxy serverless
- El rate limiting está configurado a 100 requests/15min por IP
- Los logs de auditoría están habilitados para todas las operaciones
- La configuración de CORS está restringida por seguridad
