// components/TakeExam.jsx
import React, { useState, useEffect, useRef } from "react";
import { getToken } from '../utils/api';
import { createSocket, joinRoom, createDevice, createSendTransport, produce, getSocket } from '../webrtc/mediasoupClient';
import { Clock, AlertCircle, Send } from "lucide-react";

const monitorEvent = async (sessionId, eventType, severity = 'info', description = '', details = {}) => {
  if (!sessionId) return;
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    await fetch(`/api/exams/${sessionId}/proctoring-log`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventType, severity, description, ...details }),
    });
  } catch (error) {
    console.error('Unable to log proctoring event', error);
  }
};

export default function TakeExam({ user, setRoute }) {
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examInitialized, setExamInitialized] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [submittedFiles, setSubmittedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [paper, setPaper] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const examId = params.get("id");
    if (examId) {
      initializeExam(examId);
    }
  }, []);

  const initializeExam = async (examId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const examRes = await fetch(`/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!examRes.ok) throw new Error("Failed to fetch exam");
      const examData = await examRes.json();

      const examWithQuestions = {
        ...examData.exam,
        questions: examData.questions || [],
      };
      setExam(examWithQuestions);
      setTimeRemaining(examData.exam.duration * 60);
      setExamInitialized(true);
    } catch (err) {
      console.error("Error initializing exam:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!exam?._id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const sessionRes = await fetch(`/api/exams/${exam._id}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!sessionRes.ok) throw new Error("Failed to start exam");
      const sessionData = await sessionRes.json();
      setSession(sessionData.session);
      setTimeRemaining(Math.max(0, Math.floor((new Date(sessionData.session.expiresAt).getTime() - Date.now()) / 1000)));
      setExamStarted(true);
      const paperRes = await fetch(`/api/exam-papers/${exam._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (paperRes.ok) { const paperData = await paperRes.json(); setPaper(paperData.paper); }
    } catch (err) {
      console.error("Error starting exam:", err);
      alert("Unable to start the exam right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.expiresAt) return;
    const updateFromServerClock = () => setTimeRemaining(Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)));
    updateFromServerClock();
    const timer = setInterval(updateFromServerClock, 1000);
    return () => clearInterval(timer);
  }, [session?.expiresAt]);

  useEffect(() => {
    if (!session?._id || !examStarted) return;
    const saveAnswers = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const payloadAnswers = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
        const response = await fetch(`/api/exams/session/${session._id}/answers`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payloadAnswers, answerVersion: session.answerVersion }),
        });
        if (!response.ok) return;
        const saved = await response.json();
        setSession((previous) => previous ? { ...previous, answerVersion: saved.answerVersion, expiresAt: saved.expiresAt } : previous);
      } catch (error) {
        console.warn("Unable to autosave answers; the exam remains open and will retry.");
      }
    };
    const interval = setInterval(saveAnswers, 20_000);
    return () => clearInterval(interval);
  }, [session?._id, session?.answerVersion, answers, examStarted]);

  useEffect(() => {
    if (!session?._id || !exam) return;

    const sendActivity = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const question = exam.questions?.[currentQuestion];
        await fetch(`/api/exams/session/${session._id}/activity`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentQuestionIndex: currentQuestion,
            currentQuestionId: question?._id || null,
            currentAnswerPreview: answers[question?._id] || "",
            eventType: "activity_update",
            source: "exam",
          }),
        });
      } catch (err) {
        console.error("Unable to sync exam activity", err);
      }
    };

    sendActivity();
    const interval = setInterval(sendActivity, 15000);
    return () => clearInterval(interval);
  }, [session?._id, exam, currentQuestion, answers]);

  const logEvent = async (eventType, severity = "info", description = "", details = {}) => {
    if (!session?._id) return;
    await monitorEvent(session._id, eventType, severity, description, details);
  };

  const syncCameraState = async (enabled, status) => {
    if (!session?._id) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch(`/api/exams/session/${session._id}/activity`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cameraEnabled: enabled,
          cameraStatus: status,
          eventType: enabled ? "camera_started" : "camera_stopped",
          source: "camera",
        }),
      });
    } catch (error) {
      console.error("Unable to sync camera state", error);
    }
  };

  useEffect(() => {
    const handleVisibility = () => {
      logEvent(document.hidden ? "page_visibility" : "window_focus", document.hidden ? "warning" : "info", document.hidden ? "Student left the visible tab" : "Student returned to the exam page", { hidden: document.hidden });
    };

    const handleBlur = () => {
      logEvent("window_blur", "warning", "Student moved away from the exam window");
    };

    const handleFocus = () => {
      logEvent("window_focus", "info", "Student returned to the exam window");
    };

    const handleFullscreenChange = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      logEvent(isFullscreen ? "fullscreen_enter" : "fullscreen_exit", isFullscreen ? "warning" : "info", isFullscreen ? "Student entered fullscreen mode" : "Student exited fullscreen mode");
    };

    const handleBeforeUnload = () => {
      logEvent("refresh_or_close", "warning", "Student navigated away or closed the exam window");
    };

    const handleCopyPaste = (event) => {
      if (event.type === 'copy' || event.type === 'paste' || event.type === 'cut') {
        logEvent("copy_paste", "warning", `Student used ${event.type} during the exam`, { action: event.type });
      }
    };

    const handleContextMenu = () => {
      logEvent("right_click", "warning", "Student used the right-click context menu");
    };

    const handlePrint = () => {
      logEvent("print_attempt", "warning", "Student attempted to print the exam");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("beforeprint", handlePrint);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeprint", handlePrint);
    };
  }, [session?._id]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to submit your exam?")) return;

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const payloadAnswers = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const response = await fetch(`/api/exams/${session._id}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: payloadAnswers }),
      });

      if (!response.ok) throw new Error("Failed to submit exam");
      const data = await response.json();
      alert(`Exam submitted! Score: ${data.result.score}/${data.result.totalMarks}`);
      setRoute("exams/results");
    } catch (err) {
      console.error("Error submitting exam:", err);
      alert("Failed to submit exam");
    }
  };

  // Upload attachments and store returned metadata
  const handleFileUpload = async (fileList, questionId = null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingFiles(true);
    const uploaded = [];
    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fd = new FormData();
        fd.append("attachments", file);
        fd.append("examId", exam._id);
        fd.append("sessionId", session._id);
        if (questionId) fd.append("questionId", questionId);

        const res = await fetch(`/api/files`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token") || ""}` },
          body: fd,
        });
        if (!res.ok) throw new Error("Exam evidence upload was rejected");
        const data = await res.json();
        const fileEntry = Array.isArray(data) ? data[0] : data;
        const meta = fileEntry.file || fileEntry || {};
        uploaded.push({
          questionId,
          originalName: file.name,
          url: meta.url || meta.downloadUrl || meta.path || meta.fileUrl || "",
          id: meta._id || meta.id || null,
          uploadedAt: meta.uploadedAt || new Date().toISOString(),
        });
      }
      setSubmittedFiles((s) => [...s, ...uploaded]);
      await logEvent("file_uploaded", "info", "Student uploaded exam attachments", {
        questionId: questionId || null,
        fileCount: uploaded.length,
      });
    } catch (err) {
      console.error("File upload failed", err);
      alert("One or more file uploads failed");
    } finally {
      setUploadingFiles(false);
    }
  };

  // Camera preview start/stop
  const startCamera = async (attempt = 1) => {
    try {
      console.log(`[STUDENT] 🎬 Starting camera (attempt ${attempt})`);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support camera access");
      }

      console.log(`[STUDENT] 📹 Requesting getUserMedia...`);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log(`[STUDENT] ✅ Got media stream with ${stream.getVideoTracks().length} video and ${stream.getAudioTracks().length} audio tracks`);
      
      // STAGE 1: Student Capture
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      if (videoTracks[0]) {
        console.log(`[STAGE 1] VIDEO TRACK: id=${videoTracks[0].id}, readyState=${videoTracks[0].readyState}, enabled=${videoTracks[0].enabled}`);
      }
      if (audioTracks[0]) {
        console.log(`[STAGE 1] AUDIO TRACK: id=${audioTracks[0].id}, readyState=${audioTracks[0].readyState}, enabled=${audioTracks[0].enabled}`);
      }
      console.log(`[STAGE 1] MEDIA STREAM: totalTracks=${stream.getTracks().length}, videoTracks=${videoTracks.length}, audioTracks=${audioTracks.length}`);
      
      setCameraStream(stream);
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      console.log(`[STUDENT] ✅ Video element attached`);

      console.log(`[STUDENT] 🔌 Getting Socket.IO connection...`);
      let socket = getSocket();
      if (!socket || !socket.connected) {
        console.log(`[STUDENT] ⚠️ Socket not connected, creating new one...`);
        const token = getToken();
        if (!token) {
          console.error(`[STUDENT] ❌ NO TOKEN AVAILABLE - Cannot authenticate with server`);
          throw new Error("Authentication token not found. Please log in again.");
        }
        socket = await createSocket(token, window.__API_ORIGIN || '');
        console.log(`[STUDENT] ✅ Socket created, connected: ${socket?.connected}`);
      } else {
        console.log(`[STUDENT] ✅ Socket already connected`);
      }

      const roomId = session?._id;
      console.log(`[STUDENT] 📍 Room ID: ${roomId}`);
      if (!roomId) throw new Error("Exam session is not ready yet");

      console.log(`[STUDENT] 🚪 Joining room as student...`);
      const joinResp = await joinRoom(roomId, 'student');
      console.log(`[STUDENT] ✅ Joined room, got RTP capabilities`);
      
      console.log(`[STUDENT] 🎧 Creating mediasoup device...`);
      await createDevice(joinResp.rtpCapabilities);
      console.log(`[STUDENT] ✅ Device created and loaded`);
      
      console.log(`[STUDENT] 🚚 Creating send transport...`);
      const transport = await createSendTransport(roomId);
      console.log(`[STUDENT] ✅ Send transport created, ID: ${transport?.id?.slice(0, 8)}`);

      if (stream.getVideoTracks().length) {
        console.log(`[STUDENT] 🎥 Producing video track...`);
        await producerTransportProduce(stream, transport, 'video');
        console.log(`[STUDENT] ✅ Video producer created`);
      }
      
      if (stream.getAudioTracks().length) {
        console.log(`[STUDENT] 🎙️ Producing audio track...`);
        await producerTransportProduce(stream, transport, 'audio');
        console.log(`[STUDENT] ✅ Audio producer created`);
      }

      await syncCameraState(true, "ready");
      console.log(`[STUDENT] ✅ Camera state synced to server`);
      
      logEvent("camera_started", "info", "Student enabled camera preview for invigilation monitoring");
      console.log(`[STUDENT] 🎬 CAMERA STARTUP COMPLETE - Student should now be streaming!`);
    } catch (err) {
      if (attempt < 2) {
        console.log(`[STUDENT] ⚠️ Attempt ${attempt} failed, retrying in 1s...`, err.message);
        setTimeout(() => startCamera(attempt + 1), 1000);
        return;
      }
      console.error("[STUDENT] ❌ Camera start FAILED after retries:", err);
      alert("Unable to access camera: " + (err.message || err));
    }
  };

  // Helper to produce track via transport
  async function producerTransportProduce(stream, transport, kind) {
    try {
      const track = kind === 'video' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      if (!track) return null;
      // mediasoup-client transport.produce handles signaling via our helper
      const producer = await transport.produce({ track });
      return producer;
    } catch (err) {
      console.error('producerTransportProduce error', err);
      return null;
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
    }
    setCameraStream(null);
    setCameraOn(false);
    const vid = document.getElementById("proctorVideo");
    if (vid) vid.srcObject = null;
    syncCameraState(false, "off");
    logEvent("camera_stopped", "info", "Student paused camera preview");
  };

  const PdfDocumentPreview = ({ url }) => {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [scale, setScale] = useState(1.1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [rendering, setRendering] = useState(false);

    useEffect(() => {
      if (!url) {
        setLoading(false);
        setError("No PDF document is available for preview.");
        return;
      }

      if (window.pdfjsLib) {
        setLoading(true);
        setError("");
        const loadingTask = window.pdfjsLib.getDocument({ url, withCredentials: false });
        loadingTask.promise
          .then((doc) => {
            setPdfDoc(doc);
            setPageCount(doc.numPages || 0);
            setCurrentPage(1);
            setError("");
          })
          .catch(() => {
            setError("The PDF preview could not be loaded. You can still open it in a new tab.");
          })
          .finally(() => {
            setLoading(false);
          });
        return;
      }

      const existingScript = document.getElementById("exam-pdfjs-script");
      if (existingScript) {
        existingScript.addEventListener("load", loadPdfPreview);
        return () => existingScript.removeEventListener("load", loadPdfPreview);
      }

      const script = document.createElement("script");
      script.id = "exam-pdfjs-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          loadPdfPreview();
        } else {
          setError("The PDF preview library is unavailable. Please open the file directly.");
          setLoading(false);
        }
      };
      script.onerror = () => {
        setError("The PDF preview library could not be loaded. Please open the file directly.");
        setLoading(false);
      };
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }, [url]);

    useEffect(() => {
      if (!pdfDoc || !canvasRef.current) return;
      const renderPage = async () => {
        setRendering(true);
        try {
          const page = await pdfDoc.getPage(currentPage);
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");
          const viewport = page.getViewport({ scale });

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;
        } catch (err) {
          console.error("Unable to render PDF preview", err);
          setError("This PDF page could not be rendered in the browser.");
        } finally {
          setRendering(false);
        }
      };

      renderPage();
    }, [pdfDoc, currentPage, scale]);

    const loadPdfPreview = () => {
      if (!url) {
        setLoading(false);
        setError("No PDF document is available for preview.");
        return;
      }

      setLoading(true);
      setError("");
      const loadingTask = window.pdfjsLib.getDocument({ url, withCredentials: false });
      loadingTask.promise
        .then((doc) => {
          setPdfDoc(doc);
          setPageCount(doc.numPages || 0);
          setCurrentPage(1);
          setError("");
        })
        .catch(() => {
          setError("The PDF preview could not be loaded. You can still open it in a new tab.");
        })
        .finally(() => {
          setLoading(false);
        });
    };

    if (loading) {
      return (
        <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", textAlign: "center", color: "#475569" }}>
          Loading PDF preview...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <iframe
            title="Exam resource"
            src={url}
            style={{ width: "100%", minHeight: 520, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}
          />
          <p style={{ margin: 0, color: "#475569", fontSize: 13 }}>{error}</p>
        </div>
      );
    }

    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <strong>PDF preview</strong>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || rendering}
              style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", background: "#fff", cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <span style={{ color: "#334155", fontSize: 13 }}>{currentPage} / {pageCount || 1}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(pageCount || 1, prev + 1))}
              disabled={currentPage >= (pageCount || 1) || rendering}
              style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", background: "#fff", cursor: currentPage >= (pageCount || 1) ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.min(2.2, prev + 0.1))}
              style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", background: "#fff" }}
            >
              Zoom +
            </button>
            <button
              type="button"
              onClick={() => setScale((prev) => Math.max(0.8, prev - 0.1))}
              style={{ border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 8px", background: "#fff" }}
            >
              Zoom -
            </button>
          </div>
        </div>
        <div style={{ overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", padding: 8 }}>
          <canvas ref={canvasRef} style={{ display: "block", margin: "0 auto", maxWidth: "100%" }} />
        </div>
      </div>
    );
  };

  const renderResourcePanel = () => {
    const resources = Array.isArray(exam?.attachments) && exam.attachments.length > 0
      ? exam.attachments
      : (exam?.pdfUrl ? [{ originalName: "Exam resource", url: exam.pdfUrl }] : []);

    if (resources.length === 0) {
      return (
        <div style={{ padding: 16, border: "1px dashed #cbd5e1", borderRadius: 8, background: "#f8fafc" }}>
          <strong>Resources</strong>
          <p style={{ margin: "8px 0 0", color: "#475569" }}>No exam resource was attached for this assessment.</p>
        </div>
      );
    }

    const firstResource = resources[0];
    const url = firstResource.url || firstResource.downloadUrl || "";
    const lower = (url || "").toLowerCase();
    const isPdf = lower.endsWith(".pdf");
    const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(lower);
    const isOfficeDoc = /\.(doc|docx|ppt|pptx|xls|xlsx|txt|csv)$/i.test(lower);

    return (
      <div style={{ display: "grid", gap: 12 }}>
        {isPdf ? (
          <PdfDocumentPreview url={url} />
        ) : isImage ? (
          <img src={url} alt="Exam resource" style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0" }} />
        ) : isOfficeDoc ? (
          <iframe
            title="Exam resource"
            src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`}
            style={{ width: "100%", minHeight: 520, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}
          />
        ) : (
          <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc" }}>
            <strong>Resource Preview</strong>
            <p style={{ margin: "8px 0 0", color: "#475569" }}>Preview is not available for this file type.</p>
            <a href={url} target="_blank" rel="noreferrer" style={{ color: "#2563eb", display: "inline-block", marginTop: 8 }}>
              Open resource in a new tab
            </a>
          </div>
        )}

        {resources.length > 1 && (
          <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
            <strong>Additional resources</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "#334155" }}>
              {resources.slice(1).map((resource, index) => (
                <li key={`${resource.url || resource.originalName}-${index}`}>
                  <a href={resource.url || resource.downloadUrl} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                    {resource.originalName || "Attached resource"}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (loading && !examInitialized) {
    return <div style={{ textAlign: "center", padding: "60px 20px" }}>Loading exam...</div>;
  }

  if (user?.role !== "student") {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#c00" }}>
        <h2>Access denied</h2>
        <p>Only students can start and submit exams.</p>
      </div>
    );
  }

  if (!exam) {
    return <div style={{ textAlign: "center", padding: "60px 20px", color: "#c00" }}>
      <AlertCircle size={48} style={{ margin: "0 auto 20px" }} />
      Failed to load exam
    </div>;
  }

  if (!examStarted) {
    return (
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 8px 30px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", fontSize: 12 }}>Exam Readiness</p>
              <h1 style={{ margin: "8px 0", fontSize: 28 }}>{exam.title}</h1>
              <p style={{ margin: 0, color: "#475569" }}>{exam.subject || "Assessment"}</p>
            </div>
            <div style={{ padding: "10px 16px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
              {exam.duration} mins • {exam.questions?.length || 0} questions
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20, marginTop: 20 }}>
            <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc" }}>
              <h3 style={{ marginTop: 0 }}>Before you begin</h3>
              <ul style={{ paddingLeft: 20, color: "#334155", lineHeight: 1.7 }}>
                <li>Review the exam instructions and any attached resource material.</li>
                <li>Your answers and upload progress will be tracked during the session.</li>
                <li>Camera and microphone access are available through the live monitoring workflow.</li>
              </ul>
            </div>
            <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}>
              <h3 style={{ marginTop: 0 }}>Exam details</h3>
              <div style={{ display: "grid", gap: 8, color: "#334155" }}>
                <div><strong>Duration:</strong> {exam.duration} minutes</div>
                <div><strong>Total marks:</strong> {exam.totalMarks}</div>
                <div><strong>Pass threshold:</strong> {exam.passThreshold}%</div>
                <div><strong>Camera required:</strong> {exam.cameraRequired ? "Yes" : "No"}</div>
                <div><strong>Microphone required:</strong> {exam.microphoneRequired ? "Yes" : "No"}</div>
              </div>
              {exam.instructions && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#f8fafc", color: "#334155" }}>
                  <strong>Instructions</strong>
                  <p style={{ margin: "8px 0 0" }}>{exam.instructions}</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, flexWrap: "wrap", gap: 12 }}>
            <div style={{ color: "#64748b" }}>You will enter the full exam workspace after clicking start.</div>
            <button
              onClick={handleStartExam}
              style={{ padding: "12px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div style={{ textAlign: "center", padding: "60px 20px", color: "#c00" }}>
      <AlertCircle size={48} style={{ margin: "0 auto 20px" }} />
      Preparing your exam session...
    </div>;
  }

  const question = exam.questions?.[currentQuestion];

  const questionFiles = submittedFiles.filter((f) => f.questionId === question?._id);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        padding: "16px 18px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        gap: 16,
        flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{exam.title}</h1>
          <div style={{ color: "#64748b", marginTop: 4 }}>{exam.subject || "Assessment"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 12px", borderRadius: 999, background: "#fff", border: "1px solid #e2e8f0", fontWeight: 700 }}>
            <Clock size={16} style={{ display: "inline-block", marginRight: 6 }} />
            {formatTime(timeRemaining)}
          </div>
          <div style={{ padding: "8px 12px", borderRadius: 999, background: "#ecfdf5", color: "#047857", fontWeight: 700 }}>
            Saved • {navigator.onLine ? "Connected" : "Offline"}
          </div>
          <div style={{ padding: "8px 12px", borderRadius: 999, background: cameraOn ? "#eff6ff" : "#f8fafc", color: cameraOn ? "#1d4ed8" : "#475569", fontWeight: 700 }}>
            Camera {cameraOn ? "On" : "Off"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.95fr) minmax(360px, 1.35fr)", gap: 20 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#0e0c0c", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Exam Resources</h3>
            {paper && <div style={{ marginBottom: 14, padding: 14, background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: 8 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}><strong>Official question paper</strong><span style={{ fontSize: 12, color: "#475569" }}>Version {paper.version} · read only</span></div><div className="exam-word-paper" dangerouslySetInnerHTML={{ __html: paper.renderedHtml }} />{paper.mediaReferences?.length > 0 && <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>{paper.mediaReferences.map((media, index) => <li key={`${media.url}-${index}`}><a href={media.url} target="_blank" rel="noreferrer">{media.label || `Approved ${media.type || "resource"}`}</a></li>)}</ul>}</div>}
            {renderResourcePanel()}
            {exam.instructions && (
              <div style={{ marginTop: 12, padding: 12, border: "1px dashed #cbd5e1", borderRadius: 8, background: "#f8fafc" }}>
                <strong>Instructions</strong>
                <p style={{ margin: "8px 0 0", color: "#334155" }}>{exam.instructions}</p>
              </div>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Workspace Tools</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={cameraOn ? stopCamera : startCamera} style={{ padding: "10px 12px", background: cameraOn ? "#dc2626" : "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
                {cameraOn ? "Stop Camera" : "Start Camera Preview"}
              </button>
              <label style={{ display: "grid", gap: 8, padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", cursor: "pointer" }}>
                Upload working files
                <input type="file" multiple onChange={(e) => handleFileUpload(e.target.files)} />
              </label>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#0f172a" }}>
                <div style={{ padding: 12, background: cameraOn ? "#ecfeff" : "#f8fafc", color: cameraOn ? "#0f172a" : "#475569", fontWeight: 700 }}>
                  {cameraOn ? "Camera preview active" : "Camera preview is off"}
                </div>
                <video
                  ref={videoRef}
                  id="proctorVideo"
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", display: cameraOn ? "block" : "none", background: "black" }}
                />
                {!cameraOn && (
                  <div style={{ padding: 16, color: "#94a3b8", textAlign: "center" }}>
                    Start camera preview to verify your video stream before you begin.
                  </div>
                )}
              </div>
            </div>
            {uploadingFiles && <div style={{ marginTop: 10, color: "#2563eb" }}>Uploading files...</div>}
            {submittedFiles.length > 0 && (
              <div style={{ marginTop: 12, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                <strong>Attached files:</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                  {submittedFiles.map((f, idx) => (
                    <li key={idx}>
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                        {f.originalName}{f.questionId ? ` (Question ${exam.questions.findIndex((q) => q._id === f.questionId) + 1})` : ""}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
            {question ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>
                    Question {currentQuestion + 1} of {exam.questions?.length || 0}
                  </h2>
                  <div style={{ color: "#64748b" }}>Current question</div>
                </div>
                <p style={{ fontSize: "16px", marginBottom: "20px", lineHeight: 1.7 }}>{question.questionText}</p>

                {question.type === "mcq" && question.options && (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {question.options.map((option, idx) => (
                      <label key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="answer"
                          value={option.text}
                          checked={answers[question._id] === option.text}
                          onChange={(e) => {
                            setAnswers({ ...answers, [question._id]: e.target.value });
                            logEvent("question_answered", "info", "Student updated an answer", { questionId: question._id, answerLength: e.target.value.length });
                          }}
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                )}

                {question.type !== "mcq" && (
                  <textarea
                    value={answers[question._id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [question._id]: e.target.value })}
                    placeholder="Your answer..."
                    style={{
                      width: "100%",
                      minHeight: "180px",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontFamily: "monospace",
                    }}
                  />
                )}

                {question.requireWorking && (
                  <div style={{ marginTop: 20, padding: 16, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc" }}>
                    <strong>Working Required</strong>
                    <p style={{ margin: "8px 0" }}>Upload your workings for this question below.</p>
                    <label style={{ display: "grid", gap: 8 }}>
                      Upload working files
                      <input type="file" multiple onChange={(e) => handleFileUpload(e.target.files, question._id)} />
                    </label>
                    {questionFiles.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <strong>Uploaded for this question:</strong>
                        <ul>
                          {questionFiles.map((f, idx) => (
                            <li key={idx}><a href={f.url} target="_blank" rel="noreferrer">{f.originalName}</a></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>No questions available</div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setCurrentQuestion(Math.max(0, currentQuestion - 1));
                logEvent("question_viewed", "info", "Student navigated to a previous question", { currentQuestionIndex: Math.max(0, currentQuestion - 1) });
              }}
              disabled={currentQuestion === 0}
              style={{
                padding: "10px 20px",
                background: "#ddd",
                border: "none",
                borderRadius: "6px",
                cursor: currentQuestion === 0 ? "not-allowed" : "pointer",
                opacity: currentQuestion === 0 ? 0.5 : 1,
              }}
            >
              Previous
            </button>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setCurrentQuestion(Math.min(exam.questions?.length - 1 || 0, currentQuestion + 1));
                  logEvent("question_viewed", "info", "Student navigated to the next question", { currentQuestionIndex: Math.min(exam.questions?.length - 1 || 0, currentQuestion + 1) });
                }}
                disabled={currentQuestion === (exam.questions?.length - 1 || 0)}
                style={{
                  padding: "10px 20px",
                  background: "#ddd",
                  border: "none",
                  borderRadius: "6px",
                  cursor: currentQuestion === (exam.questions?.length - 1 || 0) ? "not-allowed" : "pointer",
                  opacity: currentQuestion === (exam.questions?.length - 1 || 0) ? 0.5 : 1,
                }}
              >
                Next
              </button>

              <button
                onClick={handleSubmit}
                style={{
                  padding: "10px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Send size={16} /> Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
