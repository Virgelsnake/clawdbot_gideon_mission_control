/**
 * Environment-aware configuration helpers.
 *
 * Centralises environment detection so components and API routes
 * don't need to inspect process.env directly for common checks.
 */

/** True when running in a production build (NODE_ENV === 'production'). */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Returns the canonical base URL for the running app.
 * - In production: uses NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_VERCEL_URL (Netlify sets neither by default,
 *   but the deploy URL is injected as URL by Netlify's build system).
 * - Locally: http://localhost:<port>.
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }

  // Server-side
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) return siteUrl.replace(/\/$/, '');

  const netlifyUrl = process.env.URL; // Netlify injects this during build
  if (netlifyUrl) return netlifyUrl.replace(/\/$/, '');

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

/**
 * Returns the current gateway connectivity mode.
 * - 'tunnel': production — gateway reached via Cloudflare tunnel
 * - 'local': development — gateway reached on localhost
 */
export function getGatewayMode(): 'tunnel' | 'local' {
  return process.env.OPENCLAW_GATEWAY_TUNNEL_URL ? 'tunnel' : 'local';
}

/**
 * Checks that a required server-side env var is set.
 * Throws in production, warns in development.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    const msg = `Missing required environment variable: ${name}`;
    if (isProduction()) {
      throw new Error(msg);
    }
    console.warn(`[env] ${msg}`);
    return '';
  }
  return value;
}
