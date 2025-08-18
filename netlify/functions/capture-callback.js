exports.handler = async (event, context) => {
  console.log('🎯 [Capture Callback] Function invoked');
  console.log('🎯 [Capture Callback] Full event:', JSON.stringify(event, null, 2));
  console.log('🎯 [Capture Callback] Raw URL:', event.rawUrl);
  console.log('🎯 [Capture Callback] Path:', event.path);
  console.log('🎯 [Capture Callback] Query string:', event.queryStringParameters);
  console.log('🎯 [Capture Callback] Headers:', event.headers);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'text/html'
  };

  // Manejar preflight requests (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { code, state, error, error_description } = event.queryStringParameters || {};
    
    console.log('🎯 [Capture Callback] Parsed parameters:');
    console.log('  - code:', code ? 'Presente' : 'Ausente');
    console.log('  - state:', state ? 'Presente' : 'Ausente');
    console.log('  - error:', error);
    console.log('  - error_description:', error_description);
    
    // Crear página HTML que muestre la información capturada
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Auth0 Callback Capture</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      color: white;
    }
    
    .capture-container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
    
    .capture-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    .capture-section {
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    }
    
    .capture-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #ffd700;
    }
    
    .capture-param {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
    
    .capture-param-name {
      font-weight: 500;
      color: #ffd700;
    }
    
    .capture-param-value {
      word-break: break-all;
      max-width: 60%;
    }
    
    .capture-actions {
      text-align: center;
      margin-top: 2rem;
    }
    
    .capture-button {
      background: #ffd700;
      color: #333;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      margin: 0 10px;
      transition: background 0.3s ease;
    }
    
    .capture-button:hover {
      background: #ffed4e;
    }
    
    .error-highlight {
      background: rgba(255, 0, 0, 0.2);
      border: 1px solid #ff4444;
    }
    
    .success-highlight {
      background: rgba(0, 255, 0, 0.2);
      border: 1px solid #44ff44;
    }
  </style>
</head>
<body>
  <div class="capture-container">
    <h1 class="capture-title">🎯 Auth0 Callback Capture</h1>
    
    <div class="capture-section">
      <h3>📋 Información del Callback</h3>
      <div class="capture-param">
        <span class="capture-param-name">Raw URL:</span>
        <span class="capture-param-value">${event.rawUrl || 'No disponible'}</span>
      </div>
      <div class="capture-param">
        <span class="capture-param-name">Path:</span>
        <span class="capture-param-value">${event.path}</span>
      </div>
      <div class="capture-param">
        <span class="capture-param-name">HTTP Method:</span>
        <span class="capture-param-value">${event.httpMethod}</span>
      </div>
    </div>
    
    <div class="capture-section">
      <h3>🔍 Parámetros de Query</h3>
      ${Object.entries(event.queryStringParameters || {}).map(([key, value]) => `
        <div class="capture-param ${key === 'error' ? 'error-highlight' : key === 'code' ? 'success-highlight' : ''}">
          <span class="capture-param-name">${key}:</span>
          <span class="capture-param-value">${value}</span>
        </div>
      `).join('')}
      ${Object.keys(event.queryStringParameters || {}).length === 0 ? 
        '<div class="capture-param error-highlight"><span class="capture-param-name">⚠️ No hay parámetros</span><span class="capture-param-value">Auth0 no está enviando parámetros</span></div>' : ''}
    </div>
    
    <div class="capture-section">
      <h3>🌐 Headers</h3>
      ${Object.entries(event.headers || {}).map(([key, value]) => `
        <div class="capture-param">
          <span class="capture-param-name">${key}:</span>
          <span class="capture-param-value">${value}</span>
        </div>
      `).join('')}
    </div>
    
    <div class="capture-actions">
      <button class="capture-button" onclick="window.location.href='/login.html'">🔙 Ir al Login</button>
      <button class="capture-button" onclick="window.location.href='/debug-callback.html'">🔍 Debug Callback</button>
      <button class="capture-button" onclick="copyCaptureInfo()">📋 Copiar Info</button>
    </div>
  </div>

  <script>
    function copyCaptureInfo() {
      const captureInfo = {
        rawUrl: '${event.rawUrl || 'No disponible'}',
        path: '${event.path}',
        method: '${event.httpMethod}',
        parameters: ${JSON.stringify(event.queryStringParameters || {})},
        headers: ${JSON.stringify(event.headers || {})},
        timestamp: new Date().toISOString()
      };
      
      navigator.clipboard.writeText(JSON.stringify(captureInfo, null, 2))
        .then(() => alert('Información capturada copiada al portapapeles'))
        .catch(() => alert('No se pudo copiar la información'));
    }
    
    // Log para consola
    console.log('🎯 [Capture Callback] Raw URL:', '${event.rawUrl || 'No disponible'}');
    console.log('🎯 [Capture Callback] Path:', '${event.path}');
    console.log('🎯 [Capture Callback] Parameters:', ${JSON.stringify(event.queryStringParameters || {})});
    console.log('🎯 [Capture Callback] Has Error:', ${!!error});
    console.log('🎯 [Capture Callback] Has Code:', ${!!code});
  </script>
</body>
</html>
    `;
    
    return {
      statusCode: 200,
      headers,
      body: html
    };

  } catch (error) {
    console.error('❌ [Capture Callback] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};
