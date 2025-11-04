/**
 * Security Headers Middleware
 * Adds essential HTTP security headers to all responses
 *
 * Headers included:
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: Enables XSS filter
 * - Strict-Transport-Security: Enforces HTTPS
 * - Content-Security-Policy: Prevents XSS and injection attacks
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Controls browser features
 */

export const securityHeaders = () => {
  return (req, res, next) => {
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Enforce HTTPS (only in production)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' http://localhost:* https:; " +
      "frame-ancestors 'none'"
    );

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Disable sensitive browser features
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // Remove server fingerprinting
    res.removeHeader('X-Powered-By');

    next();
  };
};

export default securityHeaders;
