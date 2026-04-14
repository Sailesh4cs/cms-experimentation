export function getImageUrl(mediaField: any): string {
  const asset = mediaField?.jsonBynderAsset;

  if (!asset) return "";

  return (
    asset.originalUrl ||   // ✅ BEST QUALITY
    asset.thumbnail ||     // ✅ fallback
    ""
  );
}