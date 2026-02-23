import React, { useCallback, useState, useEffect } from "react";
import { upload } from "../utils/api";

export default function DragDropUpload({ onUploaded, onError, maxFiles = 8, maxFileSize = 50 * 1024 * 1024 }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [blobUrls, setBlobUrls] = useState([]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [blobUrls]);

  // Validate file
  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      return `${file.name} exceeds maximum size of ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }
    return null;
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setError("");
    const list = Array.from(e.dataTransfer.files || []);
    
    // Validate all files first
    for (const f of list) {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const totalFiles = files.length + list.length;
    if (totalFiles > maxFiles) {
      setError(`Cannot exceed ${maxFiles} files. You have ${files.length}, trying to add ${list.length}`);
      return;
    }

    setFiles((prev) => [...prev, ...list]);
  }, [files.length, maxFiles, maxFileSize]);

  const onSelect = (e) => {
    setError("");
    const list = Array.from(e.target.files || []);
    
    // Validate all files first
    for (const f of list) {
      const validationError = validateFile(f);
      if (validationError) {
        setError(validationError);
        e.target.value = '';
        return;
      }
    }

    const totalFiles = files.length + list.length;
    if (totalFiles > maxFiles) {
      setError(`Cannot exceed ${maxFiles} files. You have ${files.length}, trying to add ${list.length}`);
      e.target.value = '';
      return;
    }

    setFiles((prev) => [...prev, ...list]);
    e.target.value = '';
  };

  const removeAt = (idx) => {
    setFiles((s) => {
      const newFiles = s.filter((_, i) => i !== idx);
      // Revoke blob URL for removed file if it's an image
      if (s[idx].type.startsWith("image/")) {
        // URL was created in JSX, can't revoke here easily - handled in cleanup
      }
      return newFiles;
    });
  };

  const uploadAll = async () => {
    if (!files.length) return;
    
    setError("");
    setUploading(true);
    const failedFiles = [];
    const successfulUploads = [];

    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        try {
          const data = await upload("/api/files/upload", fd);
          successfulUploads.push(data);
          onUploaded && onUploaded(data);
        } catch (e) {
          console.error("Upload failed for file", f.name, e);
          failedFiles.push(f.name);
        }
      }

      if (failedFiles.length > 0) {
        const errorMsg = `Failed to upload ${failedFiles.length} file(s): ${failedFiles.join(", ")}`;
        setError(errorMsg);
        onError && onError(new Error(errorMsg));
      } else {
        setError("");
        setFiles([]);
      }
    } catch (e) {
      const errorMsg = "Upload failed: " + (e?.message || "Unknown error");
      console.error("Upload failed", e);
      setError(errorMsg);
      onError && onError(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className={`drag-drop`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <span className="material-icon">cloud_upload</span>
          <div>
            <div style={{ fontWeight: 600 }}>Drag & drop files here</div>
            <div className="muted upload-hint" style={{ fontSize: 13 }}>or <label style={{ color: 'var(--accent)', cursor: 'pointer' }}><input onChange={onSelect} type="file" style={{ display: 'none' }} multiple /> browse</label> to choose (max {maxFiles} files)</div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, marginTop: 12, background: "#fee", border: "1px solid #fcc", color: "#c33", borderRadius: 4 }}>
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            {files.length} file(s) selected ({Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024)}MB)
          </div>
          <div className="preview-grid">
            {files.map((f, i) => {
              let blobUrl = null;
              if (f.type.startsWith("image/")) {
                blobUrl = URL.createObjectURL(f);
                if (!blobUrls.includes(blobUrl)) {
                  setBlobUrls(prev => [...prev, blobUrl]);
                }
              }
              return (
                <div key={i} className="preview">
                  {f.type.startsWith("image/") && blobUrl ? (
                    <img src={blobUrl} alt={f.name} />
                  ) : (
                    <div style={{ padding: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{f.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{Math.round(f.size / 1024)} KB</div>
                    </div>
                  )}
                  <div className="remove" onClick={() => removeAt(i)}>×</div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="menu-item" onClick={uploadAll} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button className="menu-item" onClick={() => { setFiles([]); setError(""); }} disabled={uploading}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
