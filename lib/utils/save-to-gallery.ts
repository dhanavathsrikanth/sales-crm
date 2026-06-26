export async function downloadToGallery(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function shareFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "image/jpeg" })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "PRISM RMC Site Photo" })
    return true
  }
  downloadToGallery(blob, filename)
  return false
}
