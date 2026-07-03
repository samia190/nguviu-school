// components/TeacherExamUpload.jsx
import React, { useState } from "react";
import { Upload, Plus, Clock, BarChart2, AlertCircle, CheckCircle } from "lucide-react";
import "./TeacherExamUpload.css";

export default function TeacherExamUpload({ user, setRoute }) {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    duration: 60,
    totalMarks: 100,
    passThreshold: 40,
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (user?.role !== "teacher" && user?.role !== "admin") {
    return (
      <div className="access-denied-container">
        <div className="access-denied-card">
          <h2>Access Denied</h2>
          <p>Only teachers and admins can create exams.</p>
        </div>
      </div>
    );
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please select a valid PDF file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large (max 50MB)");
      return;
    }

    setPdfFile(file);
    setPdfFileName(file.name);
    setError(null);
    await uploadPdf(file);
  };

  const uploadPdf = async (file) => {
    try {
      setLoading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("pdf", file);

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.ok) {
            setPdfUrl(response.signedUrl || response.url);
            setError(null);
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(0), 1000);
          } else {
            setError(response.error || "Upload failed");
          }
        } else {
          setError(`Upload failed: ${xhr.statusText}`);
        }
        setLoading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Network error during upload");
        setLoading(false);
      });

      xhr.open("POST", "/api/exams/upload-pdf");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setError("Failed to upload PDF");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "duration" || name === "totalMarks" || name === "passThreshold" ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!pdfUrl) {
      setError("Please upload a PDF first");
      return;
    }

    if (!formData.title.trim()) {
      setError("Exam title is required");
      return;
    }

    if (formData.duration < 5 || formData.duration > 300) {
      setError("Duration must be between 5 and 300 minutes");
      return;
    }

    if (formData.passThreshold < 0 || formData.passThreshold > 100) {
      setError("Pass threshold must be between 0 and 100");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const scheduledStart = new Date();
      const scheduledEnd = new Date();
      scheduledEnd.setDate(scheduledEnd.getDate() + 7); // Available for 7 days

      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          pdfUrl,
          pdfFileName: pdfFileName,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
          proctoringLevel: "moderate",
          isPublished: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create exam");
      }

      const data = await response.json();

      setSuccess(true);
      setTimeout(() => {
        setRoute("exams/manage");
      }, 2000);
    } catch (error) {
      console.error("Error creating exam:", error);
      setError(error.message || "Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="exam-upload-container">
      <div className="exam-upload-card">
        {/* Header */}
        <div className="exam-upload-header">
          <h2 className="exam-upload-title">
            <Plus size={28} /> Create New Exam
          </h2>
          <p className="exam-upload-subtitle">Upload an exam PDF and configure exam details</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="success-banner">
            <CheckCircle size={20} />
            <span>Exam created successfully! Redirecting...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="exam-upload-form">
          {/* PDF Upload Section */}
          <div className="form-section">
            <h3 className="form-section-title">1. Upload Exam PDF</h3>

            <div className="pdf-upload-area">
              <label className="pdf-upload-label">
                <div className="pdf-upload-icon">
                  <Upload size={40} />
                </div>
                <div className="pdf-upload-text">
                  <p className="pdf-upload-title">Click to upload exam PDF</p>
                  <p className="pdf-upload-subtitle">Max 50MB | PDF format only</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  hidden
                />
              </label>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="progress-text">{uploadProgress}%</span>
                </div>
              )}

              {/* File Status */}
              {pdfFile && pdfUrl && (
                <div className="upload-success">
                  <CheckCircle size={20} className="success-icon" />
                  <div>
                    <p className="file-name">{pdfFile.name}</p>
                    <p className="file-size">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="file-status">✓ Uploaded to cloud</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exam Details Section */}
          {pdfUrl && (
            <>
              <div className="form-section">
                <h3 className="form-section-title">2. Exam Details</h3>

                <div className="form-group">
                  <label className="form-label">Exam Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., Mathematics Final Exam 2026"
                    required
                  />
                  <p className="form-hint">This name will be visible to students</p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g., Mathematics"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration (minutes) *</label>
                    <div className="input-with-icon">
                      <Clock size={18} />
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="form-input"
                        min="5"
                        max="300"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Marks *</label>
                    <div className="input-with-icon">
                      <BarChart2 size={18} />
                      <input
                        type="number"
                        name="totalMarks"
                        value={formData.totalMarks}
                        onChange={handleInputChange}
                        className="form-input"
                        min="10"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pass Threshold (%) *</label>
                    <input
                      type="number"
                      name="passThreshold"
                      value={formData.passThreshold}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="Additional instructions for students..."
                  />
                </div>
              </div>

              {/* Submit Section */}
              <div className="form-section form-actions">
                <button
                  type="button"
                  onClick={() => setRoute("exams/manage")}
                  className="form-button form-button-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-button form-button-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
