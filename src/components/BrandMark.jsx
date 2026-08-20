export function BrandMark({ className = "", alt = "" }) {
  return (
    <img
      className={className}
      src={`${import.meta.env.BASE_URL}brand-mark.svg`}
      alt={alt}
      aria-hidden={alt ? undefined : "true"}
    />
  );
}
