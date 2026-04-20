import { del, put } from "@vercel/blob"

export function isBlobUploadConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

export async function uploadPublicImage(
  pathname: string,
  body: ArrayBuffer,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  if (!isBlobUploadConfigured()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Add Vercel Blob from the Vercel dashboard and pull env."
    )
  }
  const blob = await put(pathname, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  })
  return { url: blob.url, pathname: blob.pathname }
}

export async function deleteBlobByUrl(url: string): Promise<void> {
  if (!isBlobUploadConfigured()) return
  await del(url)
}
