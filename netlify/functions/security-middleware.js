// Middleware de seguridad centralizado para funciones de Netlify

const crypto = require('crypto');

// Cache para rate limiting (en producción usar Redis)
const rateLimitCache = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = 100;

class SecurityMiddleware {
  static checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!rateLimitCache.has(ip)) {
      rateLimitCache.set(ip, []);
    }
    
    const requests = rateLimitCache.get(ip);
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= MAX_REQUESTS) {
      return false;
    }
    
    validRequests.push(now);
    rateLimitCache.set(ip, validRequests);
    return true;
  }

  static validateSession(session) {
    if (!session) {
      return { valid: false, error: 'No autenticado', code: 'UNAUTHORIZED' };
    }

    let sessionData;
    try {
      sessionData = JSON.parse(decodeURIComponent(session));
    } catch (error) {
      return { valid: false, error: 'Sesión inválida', code: 'INVALID_SESSION' };
    }

    // Verificar expiración
    if (sessionData.expires_at && Date.now() > sessionData.expires_at) {
      return { valid: false, error: 'Sesión expirada', code: 'EXPIRED_SESSION' };
    }

    // Verificar email de Google
    if (!sessionData.user || !sessionData.user.email || !sessionData.user.email.endsWith('@gmail.com')) {
      return { valid: false, error: 'Acceso denegado', code: 'FORBIDDEN' };
    }

    return { valid: true, user: sessionData.user };
  }

  static getClientIP(event) {
    return event.headers['client-ip'] || 
           event.headers['x-forwarded-for'] || 
           event.headers['x-real-ip'] || 
           'unknown';
  }

  static createHeaders(origin = null) {
    const baseHeaders = {
      'Access-Control-Allow-Origin': origin || process.env.ALLOWED_ORIGIN || 'https://your-site.netlify.app',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };

    return baseHeaders;
  }

  static logSecurityEvent(event, level, message, details = {}) {
    const timestamp = new Date().toISOString();
    const ip = this.getClientIP(event);
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    const logEntry = {
      timestamp,
      level,
      message,
      ip,
      userAgent,
      ...details
    };

    console.log(`[Security] ${JSON.stringify(logEntry)}`);
  }

  static generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Middleware principal que combina todas las verificaciones
  static async authenticate(event) {
    const clientIP = this.getClientIP(event);
    
    // Rate limiting
    if (!this.checkRateLimit(clientIP)) {
      this.logSecurityEvent(event, 'WARN', 'Rate limit excedido', { ip: clientIP });
      return {
        success: false,
        statusCode: 429,
        body: {
          error: 'Demasiadas peticiones',
          message: 'Intenta nuevamente en 15 minutos',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      };
    }

    // Validar sesión
    const { session } = event.queryStringParameters || {};
    const sessionValidation = this.validateSession(session);
    
    if (!sessionValidation.valid) {
      this.logSecurityEvent(event, 'WARN', 'Autenticación fallida', { 
        ip: clientIP, 
        error: sessionValidation.error,
        code: sessionValidation.code 
      });
      
      return {
        success: false,
        statusCode: sessionValidation.code === 'FORBIDDEN' ? 403 : 401,
        body: {
          error: sessionValidation.error,
          message: sessionValidation.error,
          code: sessionValidation.code
        }
      };
    }

    // ✅ Autenticación exitosa
    this.logSecurityEvent(event, 'INFO', 'Acceso autorizado', { 
      ip: clientIP, 
      email: sessionValidation.user.email 
    });

    return {
      success: true,
      user: sessionValidation.user,
      ip: clientIP
    };
  }
}

module.exports = SecurityMiddleware;
