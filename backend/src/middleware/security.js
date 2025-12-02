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
 *
 * Security Grade: A+ (when properly configured in production)
 */

export const securityHeaders = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isProduction = process.env.NODE_ENV === 'production';

  // Production: Strict CSP configuration
  const productionCSP = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'https://app.example.com'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false
  };

  // Development: Relaxed CSP for hot reload
  const developmentCSP = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*', 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  };

  return helmet({
    // Content Security Policy
    contentSecurityPolicy: isProduction ? productionCSP : developmentCSP,

    // Strict Transport Security (HTTPS only in production)
    hsts: isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    } : false,

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

    // XSS Protection (deprecated but still good for older browsers)
    xssFilter: true,

    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },

    // Permissions Policy (Feature Policy)
    permissionsPolicy: {
      features: {
        accelerometer: ["'none'"],
        ambientLightSensor: ["'none'"],
        autoplay: ["'none'"],
        battery: ["'none'"],
        camera: ["'none'"],
        displayCapture: ["'none'"],
        documentDomain: ["'none'"],
        encryptedMedia: ["'none'"],
        executionWhileNotRendered: ["'none'"],
        executionWhileOutOfViewport: ["'none'"],
        fullscreen: ["'none'"],
        geolocation: ["'none'"],
        gyroscope: ["'none'"],
        magnetometer: ["'none'"],
        microphone: ["'none'"],
        midi: ["'none'"],
        navigationOverride: ["'none'"],
        payment: ["'none'"],
        pictureInPicture: ["'none'"],
        publicKeyCredentialsGet: ["'none'"],
        screenWakeLock: ["'none'"],
        syncXhr: ["'none'"],
        usb: ["'none'"],
        webShare: ["'none'"],
        xrSpatialTracking: ["'none'"],
      },
    },

    // Cross-Origin Policies
    crossOriginEmbedderPolicy: isDevelopment ? false : { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },

    // Origin Agent Cluster
    originAgentCluster: true,
  });
};

/**
 * Additional security middleware for specific headers
 */
export const additionalSecurityHeaders = (req, res, next) => {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-Download-Options
  res.setHeader('X-Download-Options', 'noopen');

  // X-Permitted-Cross-Domain-Policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Remove Server header
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
};

export default securityHeaders;
