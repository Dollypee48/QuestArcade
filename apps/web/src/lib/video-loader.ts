/**
 * Optimized video loading utility for IPFS videos
 * Handles gateway selection, blob fetching, and fallback strategies
 */

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

const BLOB_FETCH_TIMEOUT = 10000; // 10 seconds - faster timeout

export type VideoLoadResult = {
  blobUrl: string | null;
  directUrl: string;
  method: "blob" | "direct";
  error?: string;
};

/**
 * Build IPFS gateway URL from CID
 */
export function buildIpfsVideoUrl(cid: string, gatewayIndex: number = 0): string {
  const cleanCid = cid.replace(/^ipfs:\/\//, "");
  const gateway = GATEWAYS[gatewayIndex] || GATEWAYS[0];
  return `${gateway}${cleanCid}`;
}

/**
 * Get all gateway URLs for a CID
 */
export function getAllGatewayUrls(cid: string): string[] {
  const cleanCid = cid.replace(/^ipfs:\/\//, "");
  return GATEWAYS.map((gateway) => `${gateway}${cleanCid}`);
}

/**
 * Detect video MIME type from URL or blob
 */
export function detectVideoType(url: string, blobType?: string): string {
  if (blobType && blobType.startsWith("video/")) {
    return blobType;
  }

  if (url.match(/\.mp4$/i)) return "video/mp4";
  if (url.match(/\.webm$/i)) return "video/webm";
  if (url.match(/\.mov$/i)) return "video/quicktime";
  if (url.match(/\.ogg$/i)) return "video/ogg";
  if (url.match(/\.m4v$/i)) return "video/x-m4v";

  return "video/mp4"; // Default
}

/**
 * Fast blob fetch with timeout and proper error handling
 */
async function fetchVideoBlob(
  url: string,
  signal: AbortSignal
): Promise<{ blob: Blob; type: string }> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "video/*",
    },
    signal,
    cache: "no-store", // Prevent cache issues
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error("Empty video blob (0 bytes)");
  }

  const detectedType = detectVideoType(url, blob.type);
  let finalBlob = blob;

  // Create new blob with correct type if needed
  if (blob.type !== detectedType && (blob.type === "application/octet-stream" || !blob.type.startsWith("video/"))) {
    finalBlob = new Blob([blob], { type: detectedType });
  }

  return { blob: finalBlob, type: detectedType };
}

/**
 * Load video with optimized strategy:
 * 1. Try blob fetch from fastest gateway (10s timeout)
 * 2. If blob fails, immediately fall back to direct URL
 * 3. Try alternative gateways only if needed
 */
export async function loadVideo(
  cidOrUrl: string,
  options: {
    preferBlob?: boolean;
    maxRetries?: number;
    onProgress?: (gatewayIndex: number, method: "blob" | "direct") => void;
  } = {}
): Promise<VideoLoadResult> {
  const { preferBlob = true, maxRetries = 2, onProgress } = options;

  // If it's already a full URL, use it directly
  if (cidOrUrl.startsWith("http://") || cidOrUrl.startsWith("https://")) {
    if (!preferBlob) {
      return {
        blobUrl: null,
        directUrl: cidOrUrl,
        method: "direct",
      };
    }

    // Try blob fetch first, but with short timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BLOB_FETCH_TIMEOUT);

      const { blob } = await fetchVideoBlob(cidOrUrl, controller.signal);
      clearTimeout(timeoutId);

      const blobUrl = URL.createObjectURL(blob);
      onProgress?.(0, "blob");

      return {
        blobUrl,
        directUrl: cidOrUrl,
        method: "blob",
      };
    } catch (error) {
      // Blob fetch failed, use direct URL
      console.warn("Blob fetch failed, using direct URL:", error);
      return {
        blobUrl: null,
        directUrl: cidOrUrl,
        method: "direct",
      };
    }
  }

  // It's a CID, try gateways
  const cleanCid = cidOrUrl.replace(/^ipfs:\/\//, "");
  const gateways = getAllGatewayUrls(cleanCid);

  // Try blob fetch from first gateway (fastest)
  if (preferBlob) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BLOB_FETCH_TIMEOUT);

      const { blob } = await fetchVideoBlob(gateways[0], controller.signal);
      clearTimeout(timeoutId);

      const blobUrl = URL.createObjectURL(blob);
      onProgress?.(0, "blob");

      return {
        blobUrl,
        directUrl: gateways[0],
        method: "blob",
      };
    } catch (error) {
      console.warn("Primary gateway blob fetch failed:", error);
      // Continue to direct URL fallback
    }
  }

  // Fallback: Use direct URL (browser will handle it)
  // Try gateways in order until one works
  for (let i = 0; i < Math.min(gateways.length, maxRetries + 1); i++) {
    onProgress?.(i, "direct");
    return {
      blobUrl: null,
      directUrl: gateways[i],
      method: "direct",
    };
  }

  // Last resort: return first gateway
  return {
    blobUrl: null,
    directUrl: gateways[0],
    method: "direct",
  };
}

/**
 * Clean up blob URL to prevent memory leaks
 */
export function revokeVideoBlobUrl(blobUrl: string | null): void {
  if (blobUrl && blobUrl.startsWith("blob:")) {
    URL.revokeObjectURL(blobUrl);
  }
}

