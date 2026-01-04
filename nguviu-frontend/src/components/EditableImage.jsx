import { useState, useEffect } from "react";

export default function EditableImage({ src, alt, onSave, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(src);
  const [caption, setCaption] = useState(alt);

  useEffect(() => {
    setUrl(src);
    setCaption(alt);
  }, [src, alt]);

  function handleSave() {
    setEditing(false);
    if (onSave) onSave({ src: url, alt: caption });
  }

  if (!isAdmin) {
    return <img src={src} alt={alt} style={{ width: "100%", borderRadius: "4px" }} />;
  }

  return editing ? (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Image URL"
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Alt text"
        style={{ width: "100%", marginBottom: "0.5rem" }}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      onClick={() => setEditing(true)}
      style={{ width: "100%", borderRadius: "4px", cursor: "pointer", border: "2px dashed #ccc" }}
    />
  );
}
