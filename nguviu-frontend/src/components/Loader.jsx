import React from "react";
import "./loader.css";

export default function Loader({ size = 140 }) {
  const px = typeof size === "number" ? `${size}px` : size;

  return (
    <div className="site-loader" style={{ ["--loader-size"]: px }}>
      <div className="loader-ring" />
      <div className="loader-inner">
        <img src="public/header/logo.png" alt="NGUVIU logo" className="loader-logo" />
      </div>
    </div>
  );
}

