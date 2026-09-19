type CertificateBlob = {
  uploadedAt: Date
  url: string
}

export function isCronAuthorized(authorization: string | null, secret: string | undefined): boolean {
  return Boolean(secret && authorization === `Bearer ${secret}`)
}

export function findOrphanedCertificateBlobs<T extends CertificateBlob>(
  blobs: T[],
  referencedURLs: ReadonlySet<string>,
  cutoff: Date,
): T[] {
  return blobs.filter(
    (blob) => blob.uploadedAt.getTime() <= cutoff.getTime() && !referencedURLs.has(blob.url),
  )
}
