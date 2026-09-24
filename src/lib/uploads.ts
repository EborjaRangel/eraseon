import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function saveUpload(bardaId: string, file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > 8 * 1024 * 1024) {
    throw new Error("La imagen supera 8 MB.");
  }
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  if (useBlob()) {
    const blob = await put(`uploads/${bardaId}/${name}`, bytes, {
      access: "public",
      contentType: "image/jpeg",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", bardaId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `/uploads/${bardaId}/${name}`;
}

export async function removeUpload(url: string | null | undefined) {
  if (!url) return;
  if (url.startsWith("/uploads/")) {
    const full = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    await unlink(full).catch(() => undefined);
    return;
  }
  if (url.includes("blob.vercel-storage.com") && process.env.BLOB_READ_WRITE_TOKEN) {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => undefined);
  }
}
