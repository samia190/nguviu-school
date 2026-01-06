import React from "react";
import useInView from "../hooks/useInView";

export default function LazyImage({ src, srcSet, sizes, alt = "", className, style, placeholder, ...props }) {
  const [ref, inView] = useInView({ rootMargin: "200px" });

  // When in view, render the real <img> with provided src/srcSet
  return (
    <div ref={ref} className={className} style={{ display: "block", ...style }}>
      {inView ? (
        <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", display: "block" }} {...props} />
      ) : placeholder ? (
        placeholder
      ) : (
        <div style={{ width: "100%", height: "100%", background: "#f4f4f4" }} />
      )}
    </div>
  );
}
