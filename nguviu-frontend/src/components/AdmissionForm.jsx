import React, { useState } from "react";
import { upload } from "../utils/api";

const downloadableFiles = [
  {
    name: "Admission Brochure 2025",
    url: "/downloads/admission-brochure.pdf",
  },
  {
    name: "Admission Guidelines",
    url: "/downloads/admission-guidelines.pdf",
  },
  {
    name: "Application Form (PDF)",
    url: "/downloads/admission-application-form.pdf",
  },
];

function AdmissionForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    grade: "",
    guardianName: "",
    guardianPhone: "",
    message: "",
  });

  const [files, setFiles] = useState({
    transcript: null,
    certificate: null,
  });

  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    const { name, files } = e.target;
    setFiles((prev) => ({ ...prev, [name]: files[0] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      // Create form data for files and text
      const data = new FormData();
      for (const key in formData) {
        data.append(key, formData[key]);
      }
      if (files.transcript) data.append("transcript", files.transcript);
      if (files.certificate) data.append("certificate", files.certificate);

      const json = await upload("/api/admissions/apply", data);

      if (json && json.ok) {
        setStatus({ type: "success", message: "Application submitted successfully!" });
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          grade: "",
          guardianName: "",
          guardianPhone: "",
          message: "",
        });
        setFiles({ transcript: null, certificate: null });
      } else {
        setStatus({ type: "error", message: "Failed to submit: " + (json && json.error) });
      }
    } catch (error) {
      setStatus({ type: "error", message: "Network error: " + error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Admission Form 2025</h1>

      <section style={{ marginBottom: 20 }}>
        <h3>Download Admission Documents</h3>
        <ul>
          {downloadableFiles.map((file) => (
            <li key={file.name}>
              <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                📄 {file.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {status && (
        <p
          style={{
            padding: "10px 15px",
            borderRadius: 6,
            backgroundColor: status.type === "success" ? "#d4edda" : "#f8d7da",
            color: status.type === "success" ? "#155724" : "#721c24",
            marginBottom: 20,
          }}
        >
          {status.message}
        </p>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <fieldset style={{ border: "1px solid #ccc", padding: 20, borderRadius: 6, marginBottom: 20 }}>
          <legend>Personal Information</legend>
          <label>
            Full Name <span style={{ color: "red" }}>*</span><br />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="John Doe"
            />
          </label>

          <label>
            Email <span style={{ color: "red" }}>*</span><br />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="example@mail.com"
            />
          </label>

          <label>
            Phone Number <span style={{ color: "red" }}>*</span><br />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="+254 7XX XXX XXX"
            />
          </label>
        </fieldset>

        <fieldset style={{ border: "1px solid #ccc", padding: 20, borderRadius: 6, marginBottom: 20 }}>
          <legend>Academic Details</legend>
          <label>
            Applying For Grade <span style={{ color: "red" }}>*</span><br />
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
              style={inputStyle}
            >
              <option value="">-- Select Grade --</option>
              <option value="form1">Form 1</option>
              <option value="form2">Form 2</option>
              <option value="form3">Form 3</option>
              <option value="form4">Form 4</option>
            </select>
          </label>

          <label>
            Upload Previous Academic Transcript (PDF/JPG) <br />
            <input
              type="file"
              name="transcript"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ marginTop: 5, marginBottom: 10 }}
            />
          </label>

          <label>
            Upload Birth Certificate (PDF/JPG) <br />
            <input
              type="file"
              name="certificate"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ marginTop: 5, marginBottom: 10 }}
            />
          </label>
        </fieldset>

        <fieldset style={{ border: "1px solid #ccc", padding: 20, borderRadius: 6, marginBottom: 20 }}>
          <legend>Guardian Information</legend>
          <label>
            Guardian's Full Name<br />
            <input
              type="text"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Jane Doe"
            />
          </label>

          <label>
            Guardian's Phone Number<br />
            <input
              type="tel"
              name="guardianPhone"
              value={formData.guardianPhone}
              onChange={handleChange}
              style={inputStyle}
              placeholder="+254 7XX XXX XXX"
            />
          </label>
        </fieldset>

        <label>
          Additional Information<br />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Anything else you'd like us to know"
            style={{ ...inputStyle, height: 80 }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 20,
            backgroundColor: submitting ? "#aaa" : "#007bff",
            color: "#fff",
            padding: "12px 20px",
            border: "none",
            borderRadius: 6,
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  marginTop: 5,
  marginBottom: 15,
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 14,
};

export default AdmissionForm;
