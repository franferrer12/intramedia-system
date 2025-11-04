import zlib from 'zlib';

/**
 * Gzip Compression Middleware
 * Compresses responses to reduce bandwidth and improve performance
 *
 * Benefits:
 * - Reduces response size by 70-90% for JSON/text
 * - Faster page load times
 * - Lower bandwidth costs
 */

const shouldCompress = (req, res) => {
  // Don't compress if client doesn't accept gzip
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) {
    return false;
  }

  // Don't compress if response is already compressed
  if (res.getHeader('Content-Encoding')) {
    return false;
  }

  // Don't compress images, videos, or already compressed files
  const contentType = res.getHeader('Content-Type') || '';
  const skipTypes = ['image/', 'video/', 'audio/', 'application/pdf', 'application/zip'];
  if (skipTypes.some(type => contentType.includes(type))) {
    return false;
  }

  // Don't compress small responses (< 1KB)
  const contentLength = parseInt(res.getHeader('Content-Length') || '0');
  if (contentLength > 0 && contentLength < 1024) {
    return false;
  }

  return true;
};

export const compression = () => {
  return (req, res, next) => {
    // Skip compression check if already determined
    if (req.compressionHandled) {
      return next();
    }

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override res.json
    res.json = function(data) {
      if (shouldCompress(req, res)) {
        const jsonString = JSON.stringify(data);

        zlib.gzip(Buffer.from(jsonString), (err, compressed) => {
          if (err) {
            // Fallback to uncompressed on error
            return originalJson(data);
          }

          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Length', compressed.length);
          res.setHeader('Vary', 'Accept-Encoding');
          res.send(compressed);
        });
      } else {
        originalJson(data);
      }
    };

    // Override res.send for text/html
    res.send = function(data) {
      if (shouldCompress(req, res) && typeof data === 'string') {
        zlib.gzip(Buffer.from(data), (err, compressed) => {
          if (err) {
            return originalSend(data);
          }

          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', compressed.length);
          res.setHeader('Vary', 'Accept-Encoding');
          originalSend(compressed);
        });
      } else {
        originalSend(data);
      }
    };

    next();
  };
};

export default compression;
