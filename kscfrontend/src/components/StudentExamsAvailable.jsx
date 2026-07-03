// components/StudentExamsAvailable.jsx
import React, { useState, useEffect } from "react";
import { BookOpen, Clock, BarChart3, Play, ArrowRight, AlertCircle } from "lucide-react";
import "./StudentExamsAvailable.css";

export default function StudentExamsAvailable({ user, setRoute }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, completed

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/exams?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch exams");
      }

      const data = await response.json();
      setExams(data.exams || []);
    } catch (err) {
      console.error("Error fetching exams:", err);
      setError("Failed to load exams. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      // Enroll in exam
      const enrollRes = await fetch(`/api/exams/${examId}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!enrollRes.ok && enrollRes.status !== 400) {
        // 400 means already enrolled, which is fine
        throw new Error("Failed to enroll");
      }

      // Navigate into the app's exam route instead of a direct /exam path
      setRoute(`exams/take?id=${examId}`);
    } catch (error) {
      console.error("Error starting exam:", error);
      setError("Failed to start exam. Please try again.");
    }
  };

  if (user?.role !== "student") {
    return (
      <div className="exams-access-denied">
        <div className="access-denied-card">
          <h2>Access Restricted</h2>
          <p>Only students can view and take exams.</p>
        </div>
      </div>
    );
  }

  const filteredExams = exams.filter((exam) => {
    if (filter === "all") return true;
    // Can add more filtering logic later
    return true;
  });

  return (
    <div className="exams-container">
      {/* Header */}
      <div className="exams-header">
        <div className="exams-header-content">
          <h1 className="exams-title">
            <BookOpen size={32} /> Available Exams
          </h1>
          <p className="exams-subtitle">
            Click on an exam to get started. You can pause and resume your exam anytime.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="exams-content">
        {/* Filters */}
        <div className="exams-filters">
          <button
            className={`filter-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Exams ({exams.length})
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchExams} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading exams...</p>
          </div>
        )}

        {/* Exams Grid */}
        {!loading && filteredExams.length === 0 && (
          <div className="no-exams">
            <BookOpen size={48} />
            <h3>No Exams Available</h3>
            <p>There are no exams available for you right now. Check back soon!</p>
          </div>
        )}

        {!loading && filteredExams.length > 0 && (
          <div className="exams-grid">
            {filteredExams.map((exam) => (
              <div key={exam._id} className="exam-card">
                {/* Card Background */}
                <div className="exam-card-background" style={{
                  background: `linear-gradient(135deg, ${['#667eea', '#764ba2', '#f093fb', '#4facfe'][Math.floor(Math.random() * 4)]} 0%, ${['#764ba2', '#667eea', '#00f2fe', '#43e97b'][Math.floor(Math.random() * 4)]} 100%)`
                }} />

                {/* Card Content */}
                <div className="exam-card-content">
                  {/* Top Section */}
                  <div className="exam-card-top">
                    <div className="exam-badge">
                      <span className="proctoring-badge">{exam.proctoringLevel || 'moderate'}</span>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="exam-card-main">
                    <h3 className="exam-title">{exam.title}</h3>
                    <p className="exam-subject">{exam.subject}</p>

                    {exam.description && (
                      <p className="exam-description">{exam.description.substring(0, 100)}...</p>
                    )}
                  </div>

                  {/* Exam Details */}
                  <div className="exam-details">
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>{exam.duration} mins</span>
                    </div>
                    <div className="detail-item">
                      <BarChart3 size={16} />
                      <span>{exam.totalMarks} marks</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-pass">Pass: {exam.passThreshold}%</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartExam(exam._id)}
                    className="start-exam-button"
                  >
                    <Play size={18} />
                    Start Exam
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="info-box">
          <AlertCircle size={20} />
          <div>
            <h4>Before You Start</h4>
            <ul>
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet place to take the exam</li>
              <li>Have a pen and paper ready for rough work if needed</li>
              <li>You cannot pause the timer during the exam</li>
              <li>Your answers are auto-saved as you work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
