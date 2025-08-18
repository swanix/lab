# 🚀 Template XDiagrams - Proyecto Listo para Usar

Este template te permite usar **XDiagrams** en cualquier proyecto con **APIs protegidas** de forma rápida y segura.

## 🛡️ Seguridad Robusta Implementada

✅ **Autenticación obligatoria con Google**  
✅ **Protección escalonada** (múltiples capas de verificación)  
✅ **Rate limiting** (100 requests/15min por IP)  
✅ **API Key protegida** (nunca expuesta al frontend)  
✅ **Logging de auditoría** completo  
✅ **CORS restrictivo** configurado  

**Ver [SECURITY.md](./SECURITY.md) para detalles completos de seguridad.**

## 📁 Estructura del Template

```
template-xdiagrams/
├── README.md                    ← Este archivo
├── SECURITY.md                  ← Documentación de seguridad
├── index.html                   ← HTML principal con CDN
├── netlify.toml                 ← Configuración de Netlify
├── .env.example                 ← Ejemplo de variables de entorno
├── .gitignore                   ← Archivos a ignorar
└── netlify/
    └── functions/
        ├── sheetbest-proxy.js   ← Proxy autenticado para APIs
        ├── check-auth.js        ← Verificación de autenticación
        └── security-middleware.js ← Middleware de seguridad
```

## 🚀 Uso Rápido

### 1. Copiar el template
```bash
# Copiar toda la carpeta a tu nuevo proyecto
cp -r template-xdiagrams/ mi-nuevo-proyecto/
cd mi-nuevo-proyecto/
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus API keys
nano .env
```

### 3. Personalizar el HTML
Editar `index.html` con tu configuración:
```javascript
window.$xDiagrams = {
  url: "/.netlify/functions/sheetbest-proxy?url=https://api.sheetbest.com/sheets/TU-SHEET-ID/tabs/TU-TAB&session=" + encodeURIComponent(new URLSearchParams(window.location.search).get('session') || ''),
  title: "Mi Diagrama",
  clustersPerRow: "6 3 7 6 3"
};
```

### 4. Deploy en Netlify
```bash
# Conectar a Netlify
netlify init

# O subir a GitHub y conectar desde Netlify Dashboard
```

## 🔐 Configuración de APIs Protegidas

### Variables de entorno necesarias:
- `SHEETBEST_API_KEY`: Tu API key de SheetBest
- `AUTH0_SECRET`: Secret aleatorio de 32 caracteres
- `AUTH0_BASE_URL`: URL de tu sitio
- `AUTH0_DOMAIN`: Tu dominio de Auth0
- `AUTH0_CLIENT_ID`: Client ID de Auth0
- `AUTH0_CLIENT_SECRET`: Client Secret de Auth0
- `ALLOWED_ORIGIN`: Origen permitido para CORS

### Configurar en Netlify:
1. Ir a **Site settings** → **Environment variables**
2. Agregar todas las variables de entorno
3. Hacer deploy

## 📊 URLs de ejemplo

### Para datos locales:
```javascript
url: "datos.csv"
```

### Para APIs públicas:
```javascript
url: "https://api.ejemplo.com/datos"
```

### Para APIs protegidas (SheetBest) - RECOMENDADO:
```javascript
url: "/.netlify/functions/sheetbest-proxy?url=https://api.sheetbest.com/sheets/TU-ID/tabs/TU-TAB&session=" + encodeURIComponent(session)
```

## 🎨 Personalización

### Temas:
```javascript
showThemeToggle: true,  // Mostrar toggle de tema
```

### Layout:
```javascript
clustersPerRow: "6 3 7 6 3",  // Número de clusters por fila
spacing: 80,                  // Espaciado horizontal
verticalSpacing: 170,         // Espaciado vertical
nodeWidth: 100,               // Ancho de nodos
nodeHeight: 125               // Alto de nodos
```

## 🔧 Troubleshooting

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

## 📚 Enlaces útiles

- [Documentación XDiagrams](https://github.com/swanix/diagrams)
- [SheetBest API](https://sheet.best/docs)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Auth0 Documentation](https://auth0.com/docs)

## 🎯 Próximos pasos

1. **Personalizar** el diseño y configuración
2. **Configurar** las variables de entorno en Netlify
3. **Probar** el flujo de autenticación
4. **Monitorear** los logs de seguridad
5. **Deploy** y compartir tu diagrama

---

**¡Listo para usar con seguridad empresarial! 🚀**
