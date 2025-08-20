#!/bin/bash

# Script de migración para limpiar archivos antiguos después de la modularización
# Este script debe ejecutarse DESPUÉS de verificar que todo funciona correctamente

echo "🔧 Iniciando migración a sistema de autenticación modular..."

# Verificar que la carpeta auth existe
if [ ! -d "auth" ]; then
    echo "❌ Error: La carpeta 'auth' no existe. Ejecuta primero la modularización."
    exit 1
fi

echo "📁 Verificando estructura de auth..."
if [ ! -f "auth/assets/auth-config.js" ] || [ ! -f "auth/assets/auth.js" ] || [ ! -f "auth/assets/auth.css" ]; then
    echo "❌ Error: Faltan archivos en auth/assets/"
    exit 1
fi

if [ ! -f "auth/pages/login.html" ] || [ ! -f "auth/pages/forbidden.html" ]; then
    echo "❌ Error: Faltan archivos en auth/pages/"
    exit 1
fi

if [ ! -f "auth/functions/auth.js" ] || [ ! -f "auth/functions/auth-callback.js" ] || [ ! -f "auth/functions/check-auth.js" ] || [ ! -f "auth/functions/logout.js" ]; then
    echo "❌ Error: Faltan archivos en auth/functions/"
    exit 1
fi

echo "✅ Estructura de auth verificada correctamente"

# Crear backup de archivos originales
echo "💾 Creando backup de archivos originales..."
mkdir -p archive/auth-backup
cp login.html archive/auth-backup/ 2>/dev/null || echo "⚠️  login.html ya no existe"
cp forbidden.html archive/auth-backup/ 2>/dev/null || echo "⚠️  forbidden.html ya no existe"
cp assets/auth.js archive/auth-backup/ 2>/dev/null || echo "⚠️  assets/auth.js ya no existe"

# Eliminar archivos antiguos
echo "🗑️  Eliminando archivos antiguos..."
rm -f login.html
rm -f forbidden.html
rm -f assets/auth.js

# Eliminar funciones de netlify antiguas (solo si existen en auth/functions)
if [ -d "netlify/functions" ]; then
    echo "🗑️  Eliminando funciones de netlify antiguas..."
    rm -f netlify/functions/auth.js
    rm -f netlify/functions/auth-callback.js
    rm -f netlify/functions/check-auth.js
    rm -f netlify/functions/logout.js
    
    # Si la carpeta netlify/functions está vacía, eliminarla
    if [ -z "$(ls -A netlify/functions 2>/dev/null)" ]; then
        rmdir netlify/functions
        echo "🗑️  Carpeta netlify/functions eliminada (estaba vacía)"
    fi
    
    # Si la carpeta netlify está vacía, eliminarla
    if [ -d "netlify" ] && [ -z "$(ls -A netlify 2>/dev/null)" ]; then
        rmdir netlify
        echo "🗑️  Carpeta netlify eliminada (estaba vacía)"
    fi
fi

echo "✅ Migración completada exitosamente!"
echo ""
echo "📋 Resumen de cambios:"
echo "  ✅ Sistema de autenticación modularizado en carpeta 'auth/'"
echo "  ✅ Archivos antiguos eliminados"
echo "  ✅ Backup creado en 'archive/auth-backup/'"
echo "  ✅ netlify.toml actualizado"
echo "  ✅ index.html actualizado"
echo ""
echo "🚀 Para usar en otros proyectos:"
echo "  1. Copia la carpeta 'auth/' al nuevo proyecto"
echo "  2. Configura las variables de entorno en Netlify"
echo "  3. Actualiza el netlify.toml"
echo "  4. Incluye los scripts en tu index.html"
echo ""
echo "📖 Ver 'auth/README.md' para documentación completa"
