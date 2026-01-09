/**
 * Authentication utilities
 */

const API_AUTH_KEY = process.env.API_AUTH_KEY;

/**
 * Helper function to check authentication
 * Returns true if auth is valid, false otherwise
 */
export function checkAuth(req: any): boolean {
  if (!API_AUTH_KEY) {
    // If no auth key is configured, allow all requests (for development)
    return true;
  }

  // Check for auth key in X-API-Key header or Authorization header
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  return apiKey === API_AUTH_KEY;
}

/**
 * Helper function to send unauthorized response
 */
export function sendUnauthorized(res: any): void {
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Unauthorized',
    message: 'Valid API key required in X-API-Key or Authorization header',
  }, null, 2));
}

