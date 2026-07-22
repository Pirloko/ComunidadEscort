/** Detección best-effort de smartphone (fricción UX, no DRM). */

const PHONE_UA =
  /Android.+Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile.+Firefox|Windows Phone/i

/**
 * True si el cliente parece un teléfono.
 * iPad / desktop / emulación burda pueden fallar — es política de producto, no seguridad.
 */
export function isSmartphoneClient(): boolean {
  if (typeof navigator === 'undefined') return true
  return PHONE_UA.test(navigator.userAgent || '')
}
