import { useEffect, useState } from "react";

import { normalizeRenderablePublicMediaUrl } from "./publicMedia";

export function PublicImageWithFallback({ alt, fallback = null, onError, src, ...imgProps }) {
  const normalizedSrc = normalizeRenderablePublicMediaUrl(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || hasError) {
    return fallback;
  }

  function handleError(event) {
    setHasError(true);
    onError?.(event);
  }

  return <img {...imgProps} alt={alt} onError={handleError} src={normalizedSrc} />;
}
