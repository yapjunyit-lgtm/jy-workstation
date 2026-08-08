/**
 * Manual service worker management.
 *
 * - On loopback origins (local bridge / dev server) we UNREGISTER any
 *   stale service worker and do NOT register a new one — a stale SW is
 *   the #1 cause of "black page after update" on http://127.0.0.1:4788.
 * - On real https origins (GitHub Pages / Firebase Hosting) the PWA
 *   registers normally.
 */
export async function setupServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  // Always clear stale registrations first (idempotent, harmless on https)
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  } catch { /* ignore */ }

  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(window.location.hostname);
  if (loopback || window.location.protocol !== 'https:') {
    // Local-only origin: skip PWA registration to avoid stale-cache issues
    return;
  }

  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch { /* PWA disabled in dev */ }
}
