import helmet from 'helmet';

/**
 * Security Headers Middleware
 * Uses Helmet.js for comprehensive security headers
 *
 * Headers included:
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Enables XSS filter
 * - Strict-Transport-Security: Enforces HTTPS (production only)
 * - Content-Security-Policy: Prevents XSS and injection attacks
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Controls browser features
 */

export const securityHeaders = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return helmet({
    // Content Security Policy - relaxed in development
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'http://localhost:*', 'https:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Strict Transport Security (HTTPS only in production)
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // Prevent clickjacking
    frameguard: {
      action: 'deny',
    },

    // Prevent MIME sniffing
    noSniff: true,

    // Referrer policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },

    // XSS Protection
    xssFilter: true,

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },

    // Permissions Policy
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        payment: ["'none'"],
      },
    },
  });
};

export default securityHeaders;
