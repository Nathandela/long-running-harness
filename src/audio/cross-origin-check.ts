/**
 * Checks if the page is cross-origin isolated (COOP/COEP headers set).
 * Required for SharedArrayBuffer support.
 */
export function isCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== "undefined" && crossOriginIsolated;
}
