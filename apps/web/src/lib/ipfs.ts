const DEFAULT_GATEWAY = (process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/").replace(/\/?$/, "/");

export type UploadResult = {
  cid: string;
  url: string;
};

export async function uploadToPinata(file: File) {
  const endpoint = process.env.NEXT_PUBLIC_IPFS_UPLOAD_ENDPOINT;
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!endpoint || !jwt) {
    throw new Error("IPFS upload endpoint or Pinata JWT is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to upload file to IPFS.");
  }

  const data = (await response.json()) as { IpfsHash: string };
  const cid = data.IpfsHash;
  return {
    cid,
    url: buildIpfsGatewayUrl(cid)!,
  };
}

export function buildIpfsGatewayUrl(reference?: string) {
  if (!reference) {
    return undefined;
  }

  const trimmed = reference.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("ipfs://")) {
    return `${DEFAULT_GATEWAY}${trimmed.replace("ipfs://", "")}`;
  }

  if (/^[A-Za-z0-9]+$/.test(trimmed) && trimmed.length >= 46) {
    return `${DEFAULT_GATEWAY}${trimmed}`;
  }

  return trimmed;
}


