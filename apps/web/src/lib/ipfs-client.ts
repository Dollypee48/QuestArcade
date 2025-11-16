"use client";

type UploadOptions = {
  endpoint?: string;
  token?: string;
};

type UploadResponse = {
  cid: string;
  url?: string;
};

export async function uploadToIpfs(file: File, options?: UploadOptions): Promise<UploadResponse> {
  const endpoint = options?.endpoint ?? process.env.NEXT_PUBLIC_IPFS_UPLOAD_ENDPOINT;

  if (!endpoint) {
    throw new Error("IPFS upload endpoint is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
    headers: options?.token ? { Authorization: `Bearer ${options.token}` } : undefined,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`IPFS upload failed: ${errorMessage || response.statusText}`);
  }

  const json = (await response.json()) as { cid?: string; IpfsHash?: string; url?: string };
  const cid = json.cid ?? json.IpfsHash;

  if (!cid) {
    throw new Error("IPFS upload succeeded but did not return a CID.");
  }

  return {
    cid,
    url: json.url ?? `ipfs://${cid}`,
  };
}


