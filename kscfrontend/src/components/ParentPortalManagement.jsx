import React, { useState, useEffect } from "react";
import { get, post, del } from "../utils/api";

export default function ParentPortalManagement({ user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generatedLink, setGeneratedLink] = useState(null);
  
  // Generate parent access form
  const [formData, setFormData] = useState({
    studentId: "",
    parentEmail: "",
    parentName: ""
  });
  
  const [students, setStudents] = useState([]);
  const [activeParents, setActiveParents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Fetch students for dropdown
  useEffect(() => {
    setLoadingStudents(true);
    get("/api/admin/students/list/simple")
      .then((data) => {
        setStudents(Array.isArray(data) ? data : (data?.students || []));
      })
      .catch((err) => console.error("Failed to load students:", err))
      .finally(() => setLoadingStudents(false));
  }, []);

  // Fetch active parent accounts
  useEffect(() => {
    const fetchActiveParents = async () => {
      try {
        const response = await get("/api/parent/admin/active-parents");
        setActiveParents(Array.isArray(response) ? response : (response?.parents || []));
      } catch (err) {
        console.error("Failed to load active parents:", err);
      }
    };
    
    fetchActiveParents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.studentId || !formData.parentEmail) {
        setError("Please select a student and enter parent email");
        setLoading(false);
        return;
      }

      const response = await post("/api/parent/admin/generate-parent-link", {
        studentId: formData.studentId,
        parentEmail: formData.parentEmail.toLowerCase()
      });

      setGeneratedLink({
        url: response.accessLink,
        email: formData.parentEmail,
        emailSent: response.emailSent,
        emailError: response.emailError
      });

      if (response.emailSent) {
        setSuccess(`✅ Parent access link sent to ${formData.parentEmail}`);
      } else {
        setSuccess(`⚠️ Link generated but email failed — copy and share manually`);
      }
      setFormData({ studentId: "", parentEmail: "", parentName: "" });
      
      // Refresh active parents list
      const parents = await get("/api/parent/admin/active-parents");
      setActiveParents(Array.isArray(parents) ? parents : (parents?.parents || []));
    } catch (err) {
      setError(err?.message || "Failed to generate access link");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (studentId, parentId) => {
    if (!window.confirm("Revoke this parent's access to this student?")) return;

    setLoading(true);
    setError("");

    try {
      await post("/api/parent/admin/revoke-parent-access", {
        studentId,
        parentId
      });

      setSuccess("✅ Parent access revoked");
      
      // Refresh active parents list
      const parents = await get("/api/parent/admin/active-parents");
      setActiveParents(Array.isArray(parents) ? parents : (parents?.parents || []));
    } catch (err) {
      setError(err?.message || "Failed to revoke access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👨‍👩‍👧 Parent Portal Management</h2>
        <p style={styles.subtitle}>Generate access links for parents and manage their permissions</p>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {generatedLink && (
        <div style={{
          background: generatedLink.emailSent ? "#f0fdf4" : "#fffbeb",
          border: `1px solid ${generatedLink.emailSent ? "#86efac" : "#fcd34d"}`,
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "16px"
        }}>
          <p style={{ fontWeight: 600, marginBottom: "8px", fontSize: "14px" }}>
            {generatedLink.emailSent
              ? "📧 Email sent — link also shown here for your records:"
              : "📋 Email failed — copy this link and share with the parent manually:"}
          </p>
          {generatedLink.emailError && (
            <p style={{ color: "#dc2626", fontSize: "12px", marginBottom: "8px" }}>
              Error: {generatedLink.emailError}
            </p>
          )}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              readOnly
              value={generatedLink.url}
              style={{
                flex: 1,
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "monospace",
                background: "#fff"
              }}
              onFocus={e => e.target.select()}
            />
            <button
              onClick={() => { navigator.clipboard.writeText(generatedLink.url); }}
              style={{
                padding: "8px 14px",
                background: "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                whiteSpace: "nowrap"
              }}
            >
              Copy
            </button>
            <button
              onClick={() => setGeneratedLink(null)}
              style={{
                padding: "8px 10px",
                background: "#e5e7eb",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Generate Access Link Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>🔗 Generate Parent Access Link</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              ...styles.toggleButton,
              background: showForm ? "#ef4444" : "#667eea"
            }}
          >
            {showForm ? "Hide Form" : "Generate Link"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleGenerateLink} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Student *</label>
              <select
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                disabled={loadingStudents}
                style={styles.input}
              >
                <option value="">
                  {loadingStudents ? "Loading students..." : "Choose a student..."}
                </option>
                {students.map((student) => (
                  <option key={student._id || student.id} value={student._id || student.id}>
                    {student.firstName} {student.lastName} (ID: {student.admissionNumber || student.id})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Parent Email Address *</label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleInputChange}
                placeholder="parent@example.com"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Parent Name (Optional)</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleInputChange}
                placeholder="Parent's full name"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.studentId || !formData.parentEmail}
              style={{
                ...styles.submitButton,
                opacity: loading || !formData.studentId || !formData.parentEmail ? 0.6 : 1
              }}
            >
              {loading ? "Generating..." : "📧 Generate & Send Link"}
            </button>

            <div style={styles.info}>
              <strong>ℹ️ What happens:</strong>
              <ul style={styles.infoList}>
                <li>Parent receives email with unique access link</li>
                <li>Link expires after 30 days for security</li>
                <li>Parent can view results, compare performance, and get recommendations</li>
                <li>You can revoke access anytime from the list below</li>
              </ul>
            </div>
          </form>
        )}
      </div>

      {/* Active Parents Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>💼 Active Parent Accounts</h3>
        
        {activeParents && activeParents.length > 0 ? (
          <div style={styles.parentsList}>
            {activeParents.map((parent, idx) => (
              <div key={idx} style={styles.parentCard}>
                <div style={styles.parentInfo}>
                  <div style={styles.parentHeader}>
                    <strong style={styles.parentEmail}>{parent.email}</strong>
                    {parent.linkedStudents && parent.linkedStudents.length > 1 && (
                      <span style={styles.badge}>
                        {parent.linkedStudents.length} students
                      </span>
                    )}
                  </div>
                  <p style={styles.parentLink}>
                    Status: <span style={styles.activeStatus}>✅ Active</span>
                    {parent.accessTokenExpires && (
                      <span style={styles.expiryInfo}>
                        • Expires: {new Date(parent.accessTokenExpires).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  
                  {parent.linkedStudents && parent.linkedStudents.length > 0 && (
                    <div style={styles.linkedStudents}>
                      <strong>Access to:</strong>
                      <ul style={styles.studentList}>
                        {parent.linkedStudents.map((student, sidx) => (
                          <li key={sidx} style={styles.studentItem}>
                            <span>{typeof student === 'object' ? (student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || student.admissionNumber || student._id) : student}</span>
                            <button
                              onClick={() => handleRevokeAccess(student._id || student, parent._id)}
                              style={styles.revokeButton}
                              title="Revoke access to this student"
                            >
                              🚫 Revoke
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <p>No active parent accounts yet</p>
            <p style={styles.emptyStateHint}>Generate an access link above to create a parent account</p>
          </div>
        )}
      </div>

      {/* Statistics Section */}
      <div style={styles.statsSection}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{activeParents?.length || 0}</div>
          <div style={styles.statLabel}>Active Parents</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {activeParents?.reduce((sum, p) => sum + (p.linkedStudents?.length || 1), 0) || 0}
          </div>
          <div style={styles.statLabel}>Student Links</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{students?.length || 0}</div>
          <div style={styles.statLabel}>Total Students</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    marginBottom: "30px",
    borderBottom: "2px solid #667eea",
    paddingBottom: "15px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1e293b",
    margin: "0 0 10px 0"
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0
  },
  error: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#991b1b",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px"
  },
  success: {
    background: "#dcfce7",
    border: "1px solid #86efac",
    color: "#166534",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px"
  },
  section: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#0f172a",
    margin: 0
  },
  toggleButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a"
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontFamily: "Arial, sans-serif",
    transition: "border-color 0.2s ease"
  },
  submitButton: {
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "8px",
    transition: "transform 0.2s ease"
  },
  info: {
    background: "#e0e7ff",
    border: "1px solid #c7d2fe",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "13px",
    color: "#312e81",
    marginTop: "12px"
  },
  infoList: {
    margin: "8px 0 0 0",
    paddingLeft: "20px"
  },
  parentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  parentCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    transition: "box-shadow 0.2s ease"
  },
  parentInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  parentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  parentEmail: {
    fontSize: "16px",
    color: "#1e293b"
  },
  badge: {
    background: "#dbeafe",
    color: "#0c4a6e",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600"
  },
  parentLink: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0
  },
  activeStatus: {
    color: "#16a34a",
    fontWeight: "600"
  },
  expiryInfo: {
    fontSize: "12px",
    color: "#94a3b8"
  },
  linkedStudents: {
    marginTop: "8px"
  },
  studentList: {
    margin: "8px 0 0 0",
    padding: "0 0 0 20px"
  },
  studentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "13px",
    color: "#475569",
    margin: "6px 0"
  },
  revokeButton: {
    padding: "4px 8px",
    fontSize: "12px",
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#64748b"
  },
  emptyStateHint: {
    fontSize: "13px",
    color: "#94a3b8",
    marginTop: "8px"
  },
  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "24px"
  },
  statCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "white"
  },
  statNumber: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "8px"
  },
  statLabel: {
    fontSize: "13px",
    opacity: 0.9
  }
};
