import React, { useEffect, useState } from "react";
import { get, post, put, del, upload } from "../utils/api";

export default function LegalManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", file: null });
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const data = await get("/api/legal");
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load legal documents");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setFormError("Only PDF, DOC, and DOCX files are allowed");
        return;
      }
      
      // Validate file size (max 20MB)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        setFormError("File size cannot exceed 20MB");
        return;
      }
      
      setFormError("");
      setForm((f) => ({ ...f, file: file }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleEdit(doc) {
    setEditId(doc.id);
    setForm({ title: doc.title, description: doc.description, file: null });
    setFormError("");
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this document?")) return;
    try {
      await del(`/api/legal/${id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setError("Failed to delete document");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    
    // Validate title
    if (!form.title) {
      setFormError("Title is required");
      return;
    }
    if (form.title.length > 255) {
      setFormError("Title cannot exceed 255 characters");
      return;
    }
    if (form.description.length > 2000) {
      setFormError("Description cannot exceed 2,000 characters");
      return;
    }

    setFormLoading(true);
    try {
      const bodyData = {
        title: form.title,
        description: form.description,
      };

      if (editId) {
        // Update document metadata
        await put(`/api/legal/${editId}`, bodyData);
        
        // If new file provided, upload it separately
        if (form.file) {
          const formData = new FormData();
          formData.append("file", form.file);
          await upload(`/api/legal/${editId}/file`, formData);
        }
      } else {
        // Create new document
        if (!form.file) {
          setFormError("File is required for new documents");
          setFormLoading(false);
          return;
        }
        
        // Upload file first
        const formData = new FormData();
        formData.append("file", form.file);
        formData.append("title", form.title);
        formData.append("description", form.description);
        
        const saved = await upload("/api/legal", formData);
        if (!saved) throw new Error("Failed to create document");
      }

      setForm({ title: "", description: "", file: null });
      setEditId(null);
      fetchDocuments();
    } catch (err) {
      setFormError(err.message || "Failed to save document");
    } finally {
      setFormLoading(false);
    }
  }

  function handleCancel() {
    setEditId(null);
    setForm({ title: "", description: "", file: null });
    setFormError("");
  }

  return (
    <section>
      <h2>Legal Documents Management</h2>

      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ marginBottom: 20 }}>
        <div>
          <label>Title *</label><br />
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>

        <div>
          <label>Description</label><br />
          <textarea name="description" value={form.description} onChange={handleChange} />
        </div>

        <div>
          <label>File {editId ? "(Optional to change)" : "*"}</label><br />
          <input
            type="file"
            name="file"
            onChange={handleChange}
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required={!editId}
          />
        </div>

        {formError && <p style={{ color: "red" }}>{formError}</p>}

        <button type="submit" disabled={formLoading}>
          {formLoading ? "Saving..." : editId ? "Update Document" : "Add Document"}
        </button>
        {editId && (
          <button type="button" onClick={handleCancel} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        )}
      </form>

      {loading && <p>Loading legal documents...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {documents.map((doc) => (
          <li key={doc.id} style={{ marginBottom: 20 }}>
            <strong>{doc.title}</strong>
            {doc.url && (
              <>
                {" "}
                -{" "}
                <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.originalName}>
                  Download
                </a>
              </>
            )}
            <p>{doc.description}</p>
            <div>
              <button onClick={() => handleEdit(doc)}>Edit</button>
              <button
                onClick={() => handleDelete(doc.id)}
                style={{ marginLeft: 10, color: "red" }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
