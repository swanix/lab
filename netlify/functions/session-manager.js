// Gestor de sesiones usando cookies seguras

const crypto = require('crypto');

class SessionManager {
  static parseCookies(event) {
    const cookies = {};
    const cookieHeader = event.headers.cookie || event.headers.Cookie || '';
    
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
      });
    }
    
    return cookies;
  }

  static validateSession(event) {
    const cookies = this.parseCookies(event);
    const sessionToken = cookies.session_token;
    const sessionHash = cookies.session_hash;
    
    if (!sessionToken || !sessionHash) {
      return { valid: false, error: 'No autenticado', code: 'UNAUTHORIZED' };
    }

    // En una implementación real, aquí verificarías el token contra una base de datos
    // Por ahora, usamos una validación simple
    if (sessionToken.length !== 64) { // 32 bytes = 64 caracteres hex
      return { valid: false, error: 'Token inválido', code: 'INVALID_TOKEN' };
    }

    return { valid: true, sessionToken, sessionHash };
  }

  static createSessionResponse(sessionData, expiresIn) {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionHash = crypto.createHash('sha256').update(JSON.stringify(sessionData)).digest('hex');
    
    const cookieOptions = [
      `session_token=${sessionToken}`,
      `session_hash=${sessionHash}`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${expiresIn}`
    ];

    return {
      sessionToken,
      sessionHash,
      cookieHeader: cookieOptions.join('; ')
    };
  }

  static clearSession() {
    const cookieOptions = [
      'session_token=',
      'session_hash=',
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      'Max-Age=0'
    ];

    return cookieOptions.join('; ');
  }
}

module.exports = SessionManager;
