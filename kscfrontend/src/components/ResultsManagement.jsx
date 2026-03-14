// components/ResultsManagement.jsx
import React, { useState, useEffect } from "react";
import { get, getToken } from "../utils/api";
import ResultsBulkUpload from "./ResultsBulkUpload";

const ResultsManagement = ({ user }) => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // Preview modal state
  const [showTemplateManager, setShowTemplateManager] = useState(false); // Template manager state
  const [showBulkImport, setShowBulkImport] = useState(false); // Bulk CSV import panel
  const [editingResult, setEditingResult] = useState(null);
  const [selectedResults, setSelectedResults] = useState(new Set()); // Track selected result IDs
  const [templates, setTemplates] = useState([]); // Store subject templates
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    term: "",
    year: "",
    published: "",
    curriculum: ""
  });

  const [formData, setFormData] = useState({
    admissionNumber: "",
    studentName: "",
    class: "",
    stream: "",
    assessmentNumber: "",
    curriculum: "8-4-4",
    term: "Term 1",
    year: new Date().getFullYear(),
    examType: "End of Term",
    subjects: [],
    totalMarks: 0,
    averageMarks: 0,
    overallGrade: "",
    position: "",
    outOf: "",
    attendance: {
      daysPresent: "",
      daysAbsent: "",
      totalDays: ""
    },
    conduct: {
      grade: "",
      remarks: ""
    },
    teacherRemarks: "",
    headTeacherRemarks: "",
    published: false
  });

  const [currentSubject, setCurrentSubject] = useState({
    subjectName: "",
    marks: "",
    grade: "",
    remarks: "",
    competencyLevel: ""
  });

  useEffect(() => {
    fetchResults();
    fetchStudents();
  }, [filters, pagination.page, pagination.limit]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.term) params.append("term", filters.term);
      if (filters.year) params.append("year", filters.year);
      if (filters.published) params.append("published", filters.published);
      if (filters.curriculum) params.append("curriculum", filters.curriculum);
      params.append("page", pagination.page);
      params.append("limit", pagination.limit);

      const data = await get(`/api/results/admin/all?${params}`);
      if (data && (data.results || Array.isArray(data))) {
        setResults(data.results || data || []);
        // Update pagination info if available
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch results");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Fetch students added by admin in StudentAdminManagement
      const data = await get("/api/admin/students/list/simple");
      if (data && (data.students || Array.isArray(data))) {
        setStudents(data.students || data || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    }
  };

  const handleStudentSelect = (e) => {
    const admissionNumber = e.target.value;
    const student = students.find(s => s.admissionNumber === admissionNumber);
    if (student) {
      const studentFullName = student.fullName || `${student.firstName} ${student.lastName}`.trim();
      setFormData({
        ...formData,
        admissionNumber: student.admissionNumber,
        studentName: studentFullName,
        class: student.class || "",
        stream: student.stream || "",
        assessmentNumber: student.assessmentNumber || ""
      });
    }
  };

  const handleAttendanceChange = (field, value) => {
    const daysPresent = field === 'daysPresent' ? parseInt(value) : parseInt(formData.attendance.daysPresent) || 0;
    const daysAbsent = field === 'daysAbsent' ? parseInt(value) : parseInt(formData.attendance.daysAbsent) || 0;
    const totalDays = field === 'totalDays' ? parseInt(value) : parseInt(formData.attendance.totalDays) || 0;

    let updatedAttendance = { ...formData.attendance };
    updatedAttendance[field] = value;

    // Auto-calculate total days if both present and absent are provided
    if (field === 'daysPresent' || field === 'daysAbsent') {
      if (daysPresent > 0 && daysAbsent > 0) {
        updatedAttendance.totalDays = daysPresent + daysAbsent;
      }
    }

    // Auto-calculate daysAbsent if totalDays and daysPresent are provided
    if (field === 'totalDays' && daysPresent > 0) {
      updatedAttendance.daysAbsent = Math.max(0, totalDays - daysPresent);
    }

    setFormData({
      ...formData,
      attendance: updatedAttendance
    });
  };

  const handlePositionChange = (newPosition) => {
    setFormData({
      ...formData,
      position: newPosition
    });
  };

  const addSubject = () => {
    // Validate required fields
    if (!currentSubject.subjectName || !currentSubject.marks || !currentSubject.grade) {
      alert("Please fill in subject name, marks, and grade");
      return;
    }

    // Validate marks is numeric and in valid range
    const marks = parseFloat(currentSubject.marks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      alert("Marks must be a number between 0 and 100");
      return;
    }

    // Validate grade is not empty and reasonable length
    if (currentSubject.grade.trim().length > 5) {
      alert("Grade should be short (e.g., A, B+, A-)");
      return;
    }

    setFormData({
      ...formData,
      subjects: [...formData.subjects, { ...currentSubject }]
    });

    setCurrentSubject({
      subjectName: "",
      marks: "",
      grade: "",
      remarks: "",
      competencyLevel: ""
    });

    // Auto-calculate totals
    calculateTotals([...formData.subjects, currentSubject]);
  };

  const removeSubject = (index) => {
    const newSubjects = formData.subjects.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      subjects: newSubjects
    });
    calculateTotals(newSubjects);
  };

  const calculateTotals = (subjects) => {
    if (subjects.length === 0) return;

    const total = subjects.reduce((sum, s) => sum + parseFloat(s.marks || 0), 0);
    const average = total / subjects.length;

    let grade = "F";
    
    // Different grading for 8-4-4 vs CBC
    if (formData.curriculum === "CBC") {
      // CBC Senior School uses same letter grades but emphasizes competency
      if (average >= 80) grade = "A";
      else if (average >= 75) grade = "A-";
      else if (average >= 70) grade = "B+";
      else if (average >= 65) grade = "B";
      else if (average >= 60) grade = "B-";
      else if (average >= 55) grade = "C+";
      else if (average >= 50) grade = "C";
      else if (average >= 45) grade = "C-";
      else if (average >= 40) grade = "D+";
      else if (average >= 35) grade = "D";
      else if (average >= 30) grade = "D-";
      else if (average >= 25) grade = "E";
    } else {
      // 8-4-4 System
      if (average >= 80) grade = "A";
      else if (average >= 75) grade = "A-";
      else if (average >= 70) grade = "B+";
      else if (average >= 65) grade = "B";
      else if (average >= 60) grade = "B-";
      else if (average >= 55) grade = "C+";
      else if (average >= 50) grade = "C";
      else if (average >= 45) grade = "C-";
      else if (average >= 40) grade = "D+";
      else if (average >= 35) grade = "D";
      else if (average >= 30) grade = "D-";
      else if (average >= 25) grade = "E";
    }

    setFormData({
      ...formData,
      subjects,
      totalMarks: total,
      averageMarks: average,
      overallGrade: grade
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate form before submission
    if (!formData.admissionNumber || !formData.studentName) {
      setError("Student selection is required");
      setLoading(false);
      return;
    }

    if (formData.subjects.length === 0) {
      setError("At least one subject is required");
      setLoading(false);
      return;
    }

    if (formData.curriculum === "CBC" && !formData.assessmentNumber) {
      setError("Assessment number is required for CBC students");
      setLoading(false);
      return;
    }

    if (formData.position && isNaN(parseInt(formData.position))) {
      setError("Position must be a number");
      setLoading(false);
      return;
    }

    // Enhanced: Validate position is not greater than class size
    if (formData.position && formData.outOf) {
      const position = parseInt(formData.position);
      const outOf = parseInt(formData.outOf);
      if (position > outOf) {
        setError(`Position (${position}) cannot be greater than class size (${outOf})`);
        setLoading(false);
        return;
      }
    }

    // Enhanced: Validate attendance consistency
    const daysPresent = formData.attendance.daysPresent ? parseInt(formData.attendance.daysPresent) : null;
    const daysAbsent = formData.attendance.daysAbsent ? parseInt(formData.attendance.daysAbsent) : null;
    const totalDays = formData.attendance.totalDays ? parseInt(formData.attendance.totalDays) : null;

    if (daysPresent !== null && daysAbsent !== null && totalDays !== null) {
      if (daysPresent + daysAbsent !== totalDays) {
        setError(`Attendance error: Days Present (${daysPresent}) + Days Absent (${daysAbsent}) = ${daysPresent + daysAbsent}, but Total Days is ${totalDays}`);
        setLoading(false);
        return;
      }
    }

    if (formData.year < 2000 || formData.year > new Date().getFullYear() + 1) {
      setError("Year must be between 2000 and next year");
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const url = editingResult
        ? `/api/results/admin/${editingResult._id}`
        : `/api/results/admin/create`;

      const method = editingResult ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingResult ? "Result updated successfully!" : "Result created successfully!");
        setShowForm(false);
        setEditingResult(null);
        resetForm();
        fetchResults();
      } else {
        setError(data.error || "Failed to save result");
      }
    } catch (err) {
      setError("Failed to save result: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];

    if (!file) {
      setError("Please select a PDF file");
      setLoading(false);
      return;
    }

    if (file.type !== 'application/pdf') {
      setError("Only PDF files are allowed");
      setLoading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      setLoading(false);
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('pdf', file);
    uploadFormData.append('admissionNumber', formData.admissionNumber);
    uploadFormData.append('studentName', formData.studentName);
    uploadFormData.append('class', formData.class);
    uploadFormData.append('stream', formData.stream);
    uploadFormData.append('assessmentNumber', formData.assessmentNumber || '');
    uploadFormData.append('curriculum', formData.curriculum);
    uploadFormData.append('term', formData.term);
    uploadFormData.append('year', formData.year);
    uploadFormData.append('examType', formData.examType);
    uploadFormData.append('overallGrade', formData.overallGrade);
    uploadFormData.append('averageMarks', formData.averageMarks || 0);
    uploadFormData.append('published', formData.published);

    try {
      const token = getToken();
      const response = await fetch(
        `/api/results/admin/upload-pdf`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: uploadFormData
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("PDF result uploaded successfully!");
        setShowPdfUpload(false);
        resetForm();
        fetchResults();
      } else {
        setError(data.error || "Failed to upload PDF");
      }
    } catch (err) {
      setError("Failed to upload PDF: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (resultId, currentStatus) => {
    try {
      const token = getToken();
      const response = await fetch(
        `/api/results/admin/${resultId}/publish`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ published: !currentStatus })
        }
      );

      if (response.ok) {
        setSuccess(`Result ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
        fetchResults();
      }
    } catch (err) {
      setError("Failed to update publication status");
    }
  };

  const deleteResult = async (resultId) => {
    if (!confirm("Are you sure you want to delete this result? This action cannot be undone.")) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `/api/results/admin/${resultId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setSuccess("Result deleted successfully!");
        fetchResults();
      }
    } catch (err) {
      setError("Failed to delete result");
    }
  };

  const handleResultSelect = (resultId) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map(r => r._id)));
    }
  };

  const applyTemplate = (templateSubjects) => {
    // Apply template subjects to the form
    setFormData({
      ...formData,
      subjects: templateSubjects.map(t => ({ ...t, marks: "", grade: ""  }))
    });
    setSuccess("Template applied! Now enter marks and grades for each subject.");
  };

  const saveAsTemplate = () => {
    if (formData.subjects.length === 0) {
      setError("Please add subjects first");
      return;
    }
    
    const templateName = prompt(`Save template as:`, `${formData.curriculum} - ${formData.term}`);
    if (templateName) {
      const newTemplate = {
        id: Date.now(),
        name: templateName,
        curriculum: formData.curriculum,
        subjects: formData.subjects.map(s => ({
          subjectName: s.subjectName,
          competencyLevel: s.competencyLevel
        }))
      };
      setTemplates([...templates, newTemplate]);
      setSuccess(`Template "${templateName}" saved!`);
    }
  };

  const batchPublish = async () => {
    if (selectedResults.size === 0) {
      setError("Please select at least one result to publish");
      return;
    }

    if (!confirm(`Publish ${selectedResults.size} selected result(s)?`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();
      const response = await fetch(
        `/api/results/admin/batch-publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ resultIds: Array.from(selectedResults) })
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSuccess(`Successfully published ${data.published} result(s)!`);
        setSelectedResults(new Set());
        fetchResults();
      } else {
        setError(data.error || "Failed to batch publish results");
      }
    } catch (err) {
      setError("Failed to batch publish results: " + err.message);
    } finally {
      setLoading(false);
    }
  };



  const resetForm = () => {
    setFormData({
      admissionNumber: "",
      studentName: "",
      class: "",
      stream: "",
      assessmentNumber: "",
      curriculum: "8-4-4",
      term: "Term 1",
      year: new Date().getFullYear(),
      examType: "End of Term",
      subjects: [],
      totalMarks: 0,
      averageMarks: 0,
      overallGrade: "",
      position: "",
      outOf: "",
      attendance: {
        daysPresent: "",
        daysAbsent: "",
        totalDays: ""
      },
      conduct: {
        grade: "",
        remarks: ""
      },
      teacherRemarks: "",
      headTeacherRemarks: "",
      published: false
    });
  };

  const startEdit = (result) => {
    setEditingResult(result);
    setFormData({
      ...result,
      attendance: result.attendance || { daysPresent: "", daysAbsent: "", totalDays: "" },
      conduct: result.conduct || { grade: "", remarks: "" }
    });
    setShowForm(true);
  };

  if (!user || user.role !== "admin") {
    return <div style={{ padding: "40px", textAlign: "center" }}>Access denied - Admin only</div>;
  }

  // Preview Modal Component
  const PreviewModal = () => {
    if (!showPreview) return null;
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
        }}>
          <h2 style={{ marginTop: 0 }}>📋 Preview Result</h2>
          <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
            <div style={{ marginBottom: "15px" }}>
              <strong>Student:</strong> {formData.studentName} ({formData.admissionNumber})
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>Class:</strong> {formData.class} {formData.stream}
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>Term/Year:</strong> {formData.term} {formData.year}
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>Overall Grade:</strong> <span style={{ fontSize: "20px", fontWeight: "bold" }}>{formData.overallGrade}</span>
            </div>
            <div style={{ marginBottom: "15px" }}>
              <strong>Average:</strong> {formData.averageMarks.toFixed(2)}%
            </div>
            {formData.position && <div style={{ marginBottom: "15px" }}>
              <strong>Position:</strong> {formData.position} of {formData.outOf}
            </div>}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4>📚 Subjects ({formData.subjects.length})</h4>
            {formData.subjects.length > 0 ? (
              <div style={{ 
                border: "1px solid #e0e0e0", 
                borderRadius: "6px",
                overflow: "hidden"
              }}>
                {formData.subjects.map((subj, idx) => (
                  <div key={idx} style={{
                    padding: "10px",
                    borderBottom: idx < formData.subjects.length - 1 ? "1px solid #f0f0f0" : "none",
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: "10px"
                  }}>
                    <div>{subj.subjectName}</div>
                    <div style={{ textAlign: "center" }}>{subj.marks}</div>
                    <div style={{ textAlign: "center", fontWeight: "600" }}>{subj.grade}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: "#999" }}>No subjects added</div>}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                padding: "10px 20px",
                background: "#ccc",
                color: "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              ← Back to Edit
            </button>
            <button
              onClick={() => {
                handleSubmit({ preventDefault: () => {} });
                setShowPreview(false);
              }}
              style={{
                padding: "10px 20px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              ✓ Confirm & Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Template Manager Component
  const TemplateManager = () => {
    if (!showTemplateManager) return null;
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999
      }}>
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "30px",
          maxWidth: "500px",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
        }}>
          <h2 style={{ marginTop: 0 }}>📋 Subject Templates</h2>
          {templates.length === 0 ? (
            <div style={{ color: "#999", padding: "20px", textAlign: "center" }}>
              No templates saved yet. Create one from your form first!
            </div>
          ) : (
            <div style={{ marginBottom: "20px" }}>
              {templates.map(template => (
                <div key={template.id} style={{
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontWeight: "600" }}>{template.name}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {template.subjects.length} subjects
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      applyTemplate(template.subjects);
                      setShowTemplateManager(false);
                    }}
                    style={{
                      padding: "6px 12px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowTemplateManager(false)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px"
      }}>
        <h1 style={{ margin: 0 }}>📊 Results Management</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowPdfUpload(false);
              setShowBulkImport(false);
              if (!showForm) {
                setEditingResult(null);
                resetForm();
              }
            }}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {showForm ? "✖ Cancel" : "➕ Add New Result"}
          </button>

          <button
            onClick={() => {
              setShowPdfUpload(!showPdfUpload);
              setShowForm(false);
              setShowBulkImport(false);
              if (!showPdfUpload) {
                setEditingResult(null);
                resetForm();
              }
            }}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {showPdfUpload ? "✖ Cancel" : "📄 Upload PDF Result"}
          </button>

          <button
            onClick={() => {
              setShowBulkImport(!showBulkImport);
              setShowForm(false);
              setShowPdfUpload(false);
            }}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {showBulkImport ? "✖ Cancel" : "📤 Bulk CSV Import"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          color: "#c33"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "#efe",
          border: "1px solid #cfc",
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px",
          color: "#3c3"
        }}>
          {success}
        </div>
      )}

      {showForm && (
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h2>{editingResult ? "Edit Result" : "Create New Result"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Select Student *
                </label>
                <select
                  onChange={handleStudentSelect}
                  value={formData.admissionNumber}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => (
                    <option key={student._id} value={student.admissionNumber}>
                      {student.fullName || `${student.firstName} ${student.lastName}`} ({student.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Assessment Number {formData.curriculum === "CBC" && <span style={{ color: "red" }}>*</span>}
                </label>
                <input
                  type="text"
                  value={formData.assessmentNumber}
                  onChange={(e) => setFormData({ ...formData, assessmentNumber: e.target.value })}
                  required={formData.curriculum === "CBC"}
                  placeholder={formData.curriculum === "CBC" ? "Required for CBC students" : "Optional"}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Curriculum System *
                </label>
                <select
                  value={formData.curriculum}
                  onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="8-4-4">8-4-4 System</option>
                  <option value="CBC">CBC System (Competency-Based)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Term *</label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Year *</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Exam Type *</label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px"
                  }}
                >
                  <option value="Mid Term">Mid Term</option>
                  <option value="End of Term">End of Term</option>
                  <option value="Final Exam">Final Exam</option>
                  <option value="Mock Exam">Mock Exam</option>
                </select>
              </div>
            </div>

            <h3>Subjects & Marks</h3>
            <div style={{
              background: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: formData.curriculum === "CBC" ? "2fr 1fr 1fr 1.5fr 2fr auto" : "2fr 1fr 1fr 2fr auto", 
                gap: "10px", 
                marginBottom: "15px" 
              }}>
                <input
                  type="text"
                  placeholder="Subject Name"
                  value={currentSubject.subjectName}
                  onChange={(e) => setCurrentSubject({ ...currentSubject, subjectName: e.target.value })}
                  style={{ padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
                <input
                  type="number"
                  placeholder="Marks"
                  value={currentSubject.marks}
                  onChange={(e) => setCurrentSubject({ ...currentSubject, marks: e.target.value })}
                  style={{ padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
                <input
                  type="text"
                  placeholder="Grade"
                  value={currentSubject.grade}
                  onChange={(e) => setCurrentSubject({ ...currentSubject, grade: e.target.value })}
                  style={{ padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
                {formData.curriculum === "CBC" && (
                  <select
                    value={currentSubject.competencyLevel}
                    onChange={(e) => setCurrentSubject({ ...currentSubject, competencyLevel: e.target.value })}
                    style={{ padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px", fontSize: "13px" }}
                  >
                    <option value="">Competency Level</option>
                    <option value="Exceeding Expectations">Exceeding Expectations</option>
                    <option value="Meeting Expectations">Meeting Expectations</option>
                    <option value="Approaching Expectations">Approaching Expectations</option>
                    <option value="Below Expectations">Below Expectations</option>
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Remarks (optional)"
                  value={currentSubject.remarks}
                  onChange={(e) => setCurrentSubject({ ...currentSubject, remarks: e.target.value })}
                  style={{ padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  onClick={addSubject}
                  style={{
                    padding: "10px 20px",
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Add
                </button>
              </div>

              {formData.subjects.length > 0 && (
                <div>
                  <h4>Added Subjects ({formData.subjects.length})</h4>
                  {formData.subjects.map((subject, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                        background: "white",
                        borderRadius: "6px",
                        marginBottom: "8px"
                      }}
                    >
                      <span>
                        <strong>{subject.subjectName}</strong>: {subject.marks} ({subject.grade})
                        {subject.competencyLevel && formData.curriculum === "CBC" && (
                          <span style={{ marginLeft: "10px", fontSize: "12px", color: "#666" }}>
                            • {subject.competencyLevel}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubject(index)}
                        style={{
                          padding: "6px 12px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "15px", padding: "15px", background: "white", borderRadius: "6px" }}>
                <div><strong>Total Marks:</strong> {formData.totalMarks}</div>
                <div><strong>Average:</strong> {formData.averageMarks.toFixed(2)}%</div>
                <div><strong>Overall Grade:</strong> {formData.overallGrade}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Position</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Out Of</label>
                <input
                  type="number"
                  value={formData.outOf}
                  onChange={(e) => setFormData({ ...formData, outOf: e.target.value })}
                  style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Days Present</label>
                <input
                  type="number"
                  value={formData.attendance.daysPresent}
                  onChange={(e) => handleAttendanceChange('daysPresent', e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Days Absent</label>
                <input
                  type="number"
                  value={formData.attendance.daysAbsent}
                  onChange={(e) => handleAttendanceChange('daysAbsent', e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                  placeholder="Auto-calculated if Present + Absent provided"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Total Days</label>
                <input
                  type="number"
                  value={formData.attendance.totalDays}
                  onChange={(e) => handleAttendanceChange('totalDays', e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px" }}
                  placeholder="Auto-calculated from Present + Absent"
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Class Teacher's Remarks</label>
              <textarea
                value={formData.teacherRemarks}
                onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
                rows="3"
                style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Head Teacher's Remarks</label>
              <textarea
                value={formData.headTeacherRemarks}
                onChange={(e) => setFormData({ ...formData, headTeacherRemarks: e.target.value })}
                rows="3"
                style={{ width: "100%", padding: "10px", border: "2px solid #e0e0e0", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  style={{ width: "20px", height: "20px" }}
                />
                <span style={{ fontWeight: "600" }}>Publish immediately (students can view)</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                {formData.subjects.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      style={{
                        padding: "12px 20px",
                        background: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      👁️ Preview
                    </button>
                    <button
                      type="button"
                      onClick={saveAsTemplate}
                      style={{
                        padding: "12px 20px",
                        background: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      💾 Save as Template
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowTemplateManager(true)}
                  style={{
                    padding: "12px 20px",
                    background: "#ffc107",
                    color: "#333",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  📋 Load Template
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || formData.subjects.length === 0}
                style={{
                  padding: "12px 32px",
                  background: loading || formData.subjects.length === 0 ? "#ccc" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: loading || formData.subjects.length === 0 ? "not-allowed" : "pointer"
                }}
              >
                {loading ? "Saving..." : editingResult ? "Update Result" : "Create Result"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PDF Upload Form */}
      {showPdfUpload && (
        <div style={{
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "30px",
          marginBottom: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>
          <h2>📄 Upload PDF Result</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Upload a pre-generated PDF result slip for a student. You'll need to provide student details and metadata.
          </p>

          <form onSubmit={handlePdfUpload}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              {/* Student Selection */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Select Student *
                </label>
                <select
                  value={formData.admissionNumber}
                  onChange={handleStudentSelect}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                >
                  <option value="">-- Select Student --</option>
                  {students.map(student => (
                    <option key={student.admissionNumber} value={student.admissionNumber}>
                      {student.admissionNumber} - {student.name} ({student.class} {student.stream})
                    </option>
                  ))}
                </select>
              </div>

              {/* Curriculum */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Curriculum *
                </label>
                <select
                  value={formData.curriculum}
                  onChange={(e) => setFormData({ ...formData, curriculum: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                >
                  <option value="8-4-4">8-4-4 System</option>
                  <option value="CBC">CBC (Competency-Based)</option>
                </select>
              </div>

              {/* Term */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Term *
                </label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>

              {/* Year */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Year *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  min="2020"
                  max="2030"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Exam Type */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Exam Type *
                </label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                >
                  <option value="End of Term">End of Term</option>
                  <option value="Mid Term">Mid Term</option>
                  <option value="Mock">Mock Exam</option>
                  <option value="Final">Final Exam</option>
                </select>
              </div>

              {/* Overall Grade */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Overall Grade *
                </label>
                <input
                  type="text"
                  value={formData.overallGrade}
                  onChange={(e) => setFormData({ ...formData, overallGrade: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g., A, B+, C"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Average Marks */}
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Average Marks
                </label>
                <input
                  type="number"
                  value={formData.averageMarks}
                  onChange={(e) => setFormData({ ...formData, averageMarks: parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Optional"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* PDF File */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Upload PDF File * (Max 10MB)
                </label>
                <input
                  type="file"
                  id="pdfFile"
                  accept="application/pdf"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Published */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span style={{ fontWeight: "600" }}>Publish immediately (students can view)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "15px 40px",
                background: loading ? "#ccc" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? "Uploading..." : "📤 Upload PDF Result"}
            </button>
          </form>
        </div>
      )}

      {/* Bulk CSV Import Panel */}
      {showBulkImport && (
        <div style={{ marginBottom: "30px" }}>
          <ResultsBulkUpload />
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "15px",
        marginBottom: "20px",
        flexWrap: "wrap"
      }}>
        <select
          value={filters.term}
          onChange={(e) => setFilters({ ...filters, term: e.target.value })}
          style={{
            padding: "10px",
            border: "2px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        >
          <option value="">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>

        <input
          type="number"
          placeholder="Year"
          value={filters.year}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          style={{
            padding: "10px",
            border: "2px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "14px",
            width: "120px"
          }}
        />

        <select
          value={filters.published}
          onChange={(e) => setFilters({ ...filters, published: e.target.value })}
          style={{
            padding: "10px",
            border: "2px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>

        <select
          value={filters.curriculum}
          onChange={(e) => setFilters({ ...filters, curriculum: e.target.value })}
          style={{
            padding: "10px",
            border: "2px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "14px"
          }}
        >
          <option value="">All Curricula</option>
          <option value="8-4-4">8-4-4 System</option>
          <option value="CBC">CBC System</option>
        </select>
      </div>

      {/* Results List */}
      <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        {selectedResults.size > 0 && (
          <div style={{
            padding: "15px 20px",
            background: "#e3f2fd",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span style={{ fontWeight: "600", color: "#1976d2" }}>
              {selectedResults.size} result(s) selected
            </span>
            <button
              onClick={batchPublish}
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600"
              }}
            >
              {loading ? "Publishing..." : "🚀 Publish Selected"}
            </button>
          </div>
        )}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8f9fa" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "2px solid #e0e0e0", width: "50px" }}>
                <input
                  type="checkbox"
                  checked={selectedResults.size === results.length && results.length > 0}
                  onChange={handleSelectAll}
                  style={{ cursor: "pointer", width: "18px", height: "18px" }}
                />
              </th>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Student</th>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Class</th>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Curriculum</th>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Type</th>
              <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>Term/Year</th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Grade</th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Average</th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Status</th>
              <th style={{ padding: "15px", textAlign: "center", borderBottom: "2px solid #e0e0e0" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                  Loading results...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: "40px", textAlign: "center", color: "#999" }}>
                  No results found
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr key={result._id} style={{ 
                  borderBottom: "1px solid #f0f0f0",
                  background: selectedResults.has(result._id) ? "#f5f5f5" : "white"
                }}>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result._id)}
                      onChange={() => handleResultSelect(result._id)}
                      style={{ cursor: "pointer", width: "18px", height: "18px" }}
                    />
                  </td>
                  <td style={{ padding: "15px" }}>
                    <div style={{ fontWeight: "600" }}>{result.studentName}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>{result.admissionNumber}</div>
                  </td>
                  <td style={{ padding: "15px" }}>
                    {result.class} {result.stream}
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: result.curriculum === "CBC" ? "#e3f2fd" : "#fff3e0",
                      color: result.curriculum === "CBC" ? "#1976d2" : "#e65100"
                    }}>
                      {result.curriculum || "8-4-4"}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      background: result.isUploadedPdf ? "#fce4ec" : "#e8f5e9",
                      color: result.isUploadedPdf ? "#c2185b" : "#2e7d32"
                    }}>
                      {result.isUploadedPdf ? "📄 PDF" : "✍️ Manual"}
                    </span>
                  </td>
                  <td style={{ padding: "15px" }}>
                    <div>{result.term} {result.year}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>{result.examType}</div>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center", fontWeight: "600", fontSize: "18px" }}>
                    {result.overallGrade}
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    {result.averageMarks.toFixed(1)}%
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: result.published ? "#d4edda" : "#fff3cd",
                      color: result.published ? "#155724" : "#856404"
                    }}>
                      {result.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => startEdit(result)}
                        style={{
                          padding: "6px 12px",
                          background: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(result._id, result.published)}
                        style={{
                          padding: "6px 12px",
                          background: result.published ? "#ffc107" : "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        {result.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => deleteResult(result._id)}
                        style={{
                          padding: "6px 12px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div style={{
            padding: "20px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8f9fa"
          }}>
            <div style={{ fontSize: "14px", color: "#666" }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                style={{
                  padding: "8px 12px",
                  background: pagination.page === 1 ? "#ccc" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: pagination.page === 1 ? "not-allowed" : "pointer"
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                style={{
                  padding: "8px 12px",
                  background: pagination.page === pagination.pages ? "#ccc" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: pagination.page === pagination.pages ? "not-allowed" : "pointer"
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

      {/* Render modals */}
      <PreviewModal />
      <TemplateManager />
      </div>
    </div>
  );
};

export default ResultsManagement;
