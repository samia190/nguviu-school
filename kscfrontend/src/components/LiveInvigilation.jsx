import React, { useState, useEffect, useCallback } from 'react';
import { getToken } from '../utils/api';
import { createSocket, joinRoom, createDevice, getProducers, consume, getSocket } from '../webrtc/mediasoupClient';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Pause,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import '../styles/LiveInvigilation.css';

const LiveInvigilation = ({ examId, sessionId }) => {
  const [monitoringSessions, setMonitoringSessions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    idle: 0,
    critical: 0,
    warnings: 0,
  });
  const [view, setView] = useState('grid'); // 'grid' or 'detail'
  const [producerStreams, setProducerStreams] = useState({});
  const [refreshInterval, setRefreshInterval] = useState(3000);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBySeverity, setFilterBySeverity] = useState('all');
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [recordingSession, setRecordingSession] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [connectionMessage, setConnectionMessage] = useState('Connecting to the live feed service...');

  // Fetch recording state
  const fetchRecordingState = useCallback(async () => {
    if (!examId) return;
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`/api/recording/rooms/${examId}/recording`, { headers });
      const data = await response.json();
      if (data?.ok && data.recording) {
        const enabled = Boolean(data.recording.recordingEnabled || data.recording.status === 'recording');
        setRecordingEnabled(enabled);
        setRecordingSession(data.recording);
      }
    } catch (error) {
      console.error('Error fetching recording state:', error);
    }
  }, [examId]);

  // Fetch monitoring sessions
  const fetchMonitoringSessions = useCallback(async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`/api/exams/sessions/monitoring?examId=${examId}`, { headers });
      const data = await response.json();
      if (data.ok) {
        setMonitoringSessions(data.sessions || []);
        updateStats(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching monitoring sessions:', error);
    }
  }, [examId]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await fetch(`/api/exams/${examId}/alerts`, { headers });
      const data = await response.json();
      if (data.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, [examId]);

  // Update statistics
  const updateStats = (sessions) => {
    const active = sessions.filter((s) => s.monitoringStatus === 'active').length;
    const idle = sessions.filter((s) => s.monitoringStatus === 'idle').length;
    const critical = sessions.filter((s) =>
      s.recentEvents?.some((e) => e.severity === 'critical')
    ).length;
    const warnings = sessions.filter((s) =>
      s.recentEvents?.some((e) => e.severity === 'warning')
    ).length;

    setStats({
      total: sessions.length,
      active,
      idle,
      critical,
      warnings,
    });
  };

  const updateFeedState = (state, message) => {
    setConnectionState(state);
    setConnectionMessage(message);
  };

  const upsertStreamTrack = useCallback((studentKey, track) => {
    if (!studentKey || !track) return;

    setProducerStreams((prev) => {
      const next = { ...prev };
      const existingStream = next[studentKey] || new MediaStream();
      const alreadyAttached = existingStream.getTracks().some((existingTrack) => existingTrack.id === track.id);

      if (!alreadyAttached) {
        existingStream.addTrack(track);
        console.log(`[TEACHER] ➕ Added ${track.kind} track to stream ${studentKey}`);
      }

      next[studentKey] = existingStream;
      return next;
    });
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefresh) return;

    fetchMonitoringSessions();
    fetchAlerts();

    const interval = setInterval(() => {
      fetchMonitoringSessions();
      fetchAlerts();
      fetchRecordingState();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, fetchMonitoringSessions, fetchAlerts, fetchRecordingState]);

  

  // Initialize teacher mediasoup consumer connection
  useEffect(() => {
    let mounted = true;
    let socket;

    const handleMonitoringEvent = (event) => {
      if (!mounted) return;
      const nextEvent = event || {};
      setAlerts((prev) => [
        {
          _id: nextEvent._id || `${nextEvent.eventType}-${Date.now()}`,
          ...nextEvent,
        },
        ...prev,
      ].slice(0, 20));

      setMonitoringSessions((prev) => {
        const next = prev.map((sessionItem) => {
          if (sessionItem._id !== nextEvent.sessionId) return sessionItem;
          return {
            ...sessionItem,
            recentEvents: [
              {
                _id: nextEvent._id || `${nextEvent.eventType}-${Date.now()}`,
                eventType: nextEvent.eventType,
                severity: nextEvent.severity,
                description: nextEvent.description,
                timestamp: nextEvent.timestamp || new Date().toISOString(),
              },
              ...(sessionItem.recentEvents || []),
            ].slice(0, 5),
          };
        });
        return next;
      });
    };

    const attachProducerEvents = (socketInstance) => {
      socketInstance.off('newProducer');
      socketInstance.off('producerClosed');
      
      socketInstance.on('newProducer', async ({ producerId, userId }) => {
        console.log(`[TEACHER] 📢 NEW PRODUCER EVENT RECEIVED: producerId=${producerId}, userId=${userId}`);
        if (!mounted) {
          console.log(`[TEACHER] ⚠️ Component unmounted, ignoring`);
          return;
        }
        try {
          console.log(`[TEACHER] 🍽️ Starting consume for producer ${producerId}...`);
          const cons = await consume(examId, producerId);
          console.log(`[TEACHER] ✅ Consume successful, consumer ready`);
          
          const consumer = cons.consumer;
          const streamKey = userId || producerId;

          const attachTrack = (track) => {
            if (!track) return;
            upsertStreamTrack(streamKey, track);
            console.log(`[TEACHER] ✅ Track attached to student stream: ${track.kind}`);
          };

          if (consumer.track) {
            attachTrack(consumer.track);
          } else {
            consumer.on('track', attachTrack);
            console.log(`[TEACHER] ⏳ Waiting for remote track from consumer ${consumer.id}`);
          }

          consumer.on('producerclose', () => {
            setProducerStreams((s) => {
              const next = { ...s };
              delete next[streamKey];
              return next;
            });
          });
          console.log(`[TEACHER] ✅ Producer stream added to state`);
        } catch (err) {
          console.error(`[TEACHER] ❌ Failed to consume producer ${producerId}:`, err);
        }
      });
      
      socketInstance.on('producerClosed', ({ producerId }) => {
        console.log(`[TEACHER] ❌ PRODUCER CLOSED: ${producerId}`);
        if (!mounted) return;
        setProducerStreams((s) => {
          const next = { ...s };
          Object.keys(next).forEach((key) => {
            if (key === producerId) delete next[key];
          });
          return next;
        });
      });
    };

    const initConsumers = async () => {
      try {
        console.log(`[TEACHER] 🚀 Initializing consumer for exam ${examId}...`);
        updateFeedState('connecting', 'Connecting to the live stream service...');
        
        const token = getToken();
        console.log(`[TEACHER] 🔑 Got auth token`);
        
        socket = getSocket() || await createSocket(token, window.__API_ORIGIN || '');
        console.log(`[TEACHER] 🔌 Socket connected: ${socket?.connected}`);
        
        attachProducerEvents(socket);
        socket.off('monitoringEvent');
        socket.on('monitoringEvent', handleMonitoringEvent);
        socket.emit('monitoring:subscribe', { examId });
        console.log(`[TEACHER] 📡 Producer events attached`);

        const roomId = examId;
        console.log(`[TEACHER] 🚪 Joining room ${roomId} as teacher...`);
        // STAGE 4: Teacher Join
        console.log(`[STAGE 4] TEACHER JOINING: roomId=${roomId}`);
        
        const joinResp = await joinRoom(roomId, 'teacher');
        console.log(`[TEACHER] ✅ Joined room, got RTP capabilities`);
        console.log(`[STAGE 4] TEACHER JOINED: roomId=${roomId}, rtpCapabilities=${joinResp.rtpCapabilities ? 'present' : 'missing'}, recording=${joinResp.recording}`);
        
        await createDevice(joinResp.rtpCapabilities);
        console.log(`[TEACHER] 🎧 Device created`);
        
        setRecordingEnabled(Boolean(joinResp.recording));

        socket.off('recordingStateChanged');
        socket.on('recordingStateChanged', ({ enabled, recordingSession: nextSession }) => {
          console.log(`[TEACHER] 🔴 Recording state changed: ${enabled}`);
          setRecordingEnabled(Boolean(enabled));
          setRecordingSession(nextSession || null);
        });

        console.log(`[TEACHER] 📊 Fetching existing producers from room...`);
        const resp = await getProducers(roomId);
        console.log(`[TEACHER] 📊 getProducers response:`, resp);
        
        if (!resp || !resp.ok) {
          console.log(`[TEACHER] ⚠️ No producers available yet`);
          updateFeedState('waiting', 'The room is available, but no student cameras are publishing yet.');
          return;
        }
        
        if (!resp.producers?.length) {
          console.log(`[TEACHER] ⚠️ Empty producers array`);
          updateFeedState('waiting', 'No student camera feeds are active yet. Ask students to start the exam and enable their camera.');
          return;
        }
        
        console.log(`[TEACHER] 📹 Found ${resp.producers.length} existing producer(s)`);
        updateFeedState('connected', 'Student camera feeds are now connected.');
        
        for (const p of resp.producers) {
          try {
            console.log(`[TEACHER] 🍽️ Consuming producer ${p.id}...`);
            const cons = await consume(roomId, p.id);
            const consumer = cons.consumer;
            const key = p.userId || p.id;

            const attachTrack = (track) => {
              if (!track) return;
              upsertStreamTrack(key, track);
              console.log(`[TEACHER] 📺 Added existing producer stream: ${key}`);
            };

            if (consumer.track) {
              attachTrack(consumer.track);
            } else {
              consumer.on('track', attachTrack);
            }

            console.log(`[TEACHER] ✅ Consumer setup complete for producer ${p.id}`);
          } catch (err) {
            console.error(`[TEACHER] ❌ Consume failed for producer ${p.id}:`, err);
          }
        }
        console.log(`[TEACHER] ✅ INIT COMPLETE - Waiting for new producers...`);
      } catch (err) {
        console.error('[TEACHER] ❌ initConsumers error:', err);
        updateFeedState('offline', 'Unable to connect to the live stream service. Check that the backend is running and students have joined the exam.');
      }
    };

    if (view === 'grid' && examId) {
      setProducerStreams({});
      initConsumers();
    }

    return () => {
      mounted = false;
      if (socket) {
        socket.off('newProducer');
        socket.off('producerClosed');
        socket.off('monitoringEvent');
      }
    };
  }, [view, examId]);

  // Acknowledge alert
  const acknowledgeAlert = async (alertId) => {
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      await fetch(`/api/exams/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers,
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const toggleRecording = () => {
    const socketInstance = getSocket();
    if (!socketInstance) return;
    socketInstance.emit('toggleRecording', { roomId: examId, enabled: !recordingEnabled }, (resp) => {
      if (resp?.ok) {
        setRecordingEnabled(Boolean(resp.enabled));
        setRecordingSession(resp.recordingSession || null);
      }
    });
  };

  // Filter students
  const filteredSessions = monitoringSessions.filter((session) => {
    const matchesSearch =
      session.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterBySeverity === 'critical') {
      return (
        matchesSearch &&
        session.recentEvents?.some((e) => e.severity === 'critical')
      );
    } else if (filterBySeverity === 'warning') {
      return (
        matchesSearch &&
        session.recentEvents?.some((e) => e.severity === 'warning')
      );
    }
    return matchesSearch;
  });

  // Get status color
  const getStatusColor = (status) => {
    if (status === 'submitted') return '#10b981';
    if (status === 'active') return '#3b82f6';
    if (status === 'idle') return '#f59e0b';
    return '#6b7280';
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#dc2626';
    if (severity === 'warning') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="live-invigilation-container">
      {/* Header with Title & Quick Stats */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Live Invigilation</h1>
          <p>Real-time exam monitoring and streaming</p>
        </div>
        
        <div className="quick-stats">
          <div className="quick-stat">
            <div className="quick-stat-value">{Object.keys(producerStreams).length}</div>
            <div className="quick-stat-label">Streaming Now</div>
          </div>
          <div className="quick-stat">
            <div className="quick-stat-value">{stats.total}</div>
            <div className="quick-stat-label">Total Students</div>
          </div>
          <div className={`quick-stat status-${connectionState}`}>
            <div className="status-indicator"></div>
            <div className="quick-stat-label">{connectionState === 'connected' ? 'Connected' : connectionState === 'connecting' ? 'Connecting...' : 'Waiting'}</div>
          </div>
        </div>

        <div className="header-controls">
          <button
            className={`control-btn ${recordingEnabled ? 'active' : ''}`}
            onClick={toggleRecording}
            title={recordingEnabled ? 'Stop recording' : 'Start recording'}
          >
            <Camera size={18} />
            {recordingEnabled ? 'Recording' : 'Record'}
          </button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="control-select"
          >
            <option value={2000}>2s</option>
            <option value={3000}>3s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
          </select>
        </div>
      </div>

      {/* Live Streams Section - MAIN FOCUS */}
      <div className="live-streams-section">
        <div className="section-header">
          <h2>📹 Live Student Streams</h2>
          <div className="stream-count">{Object.keys(producerStreams).length} active</div>
        </div>
        
        {Object.keys(producerStreams).length > 0 ? (
          <div className="live-streams-grid">
            {Object.entries(producerStreams).map(([producerId, ms]) => {
              const studentSession = monitoringSessions.find(
                (s) => s.studentId && (s.studentId._id === producerId || s.studentId._id === producerId)
              ) || null;
              const displayName = studentSession 
                ? (studentSession.studentId?.name || studentSession.studentId?.email) 
                : `Stream ${producerId.slice(0, 6)}`;
              return (
                <div key={producerId} className="stream-tile">
                  <StreamVideo stream={ms} />
                  <div className="stream-label">
                    <div className="stream-name">{displayName}</div>
                    <div className="stream-status">🟢 Live</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Camera size={40} strokeWidth={1.5} />
            <h3>No active streams</h3>
            <p>Students will appear here when they start their exam and enable their camera.</p>
          </div>
        )}
      </div>

      {/* Active Alerts Section */}
      {alerts.filter((a) => !a.acknowledged).length > 0 && (
        <div className="alerts-section">
          <div className="section-header">
            <h2>⚠️ Active Alerts</h2>
            <div className="alert-count">{alerts.filter((a) => !a.acknowledged).length}</div>
          </div>
          <div className="alert-list">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert._id}
                className={`alert-item alert-${alert.severity}`}
              >
                <div className="alert-content">
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="alert-message">
                    <strong>{alert.studentId?.name || 'Student'}</strong>
                    {' — '}
                    {alert.eventType || alert.description}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    className="alert-dismiss"
                    onClick={() => acknowledgeAlert(alert._id)}
                    title="Mark acknowledged"
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info Panel */}
      <div className="debug-panel">
        <div className="section-header">
          <h3>🔧 System Status</h3>
        </div>
        <div className="debug-grid">
          <div className="debug-item">
            <div className="debug-label">Socket.IO Status</div>
            <div className={`debug-value status-${connectionState}`}>{connectionState}</div>
          </div>
          <div className="debug-item">
            <div className="debug-label">Active Producers</div>
            <div className="debug-value">{Object.keys(producerStreams).length}</div>
          </div>
          <div className="debug-item">
            <div className="debug-label">Message</div>
            <div className="debug-value-text">{connectionMessage}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Card Component for Grid View
const StreamVideo = ({ stream }) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const video = ref.current;
    if (!video || !stream) return;

    // STAGE 6: Browser - Stream Inspection
    console.log(`[STAGE 6] STREAM INSPECTION:`);
    console.log(`[STAGE 6]   stream.getTracks().length=${stream.getTracks().length}`);
    console.log(`[STAGE 6]   stream.getVideoTracks().length=${stream.getVideoTracks().length}`);
    console.log(`[STAGE 6]   stream.getAudioTracks().length=${stream.getAudioTracks().length}`);
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      console.log(`[STAGE 6]   videoTrack[0].id=${videoTracks[0].id}, readyState=${videoTracks[0].readyState}, enabled=${videoTracks[0].enabled}`);
    }
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      console.log(`[STAGE 6]   audioTrack[0].id=${audioTracks[0].id}, readyState=${audioTracks[0].readyState}, enabled=${audioTracks[0].enabled}`);
    }

    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute('playsinline', 'true');
    
    // STAGE 6: Video Element Inspection
    console.log(`[STAGE 6] VIDEO ELEMENT BEFORE PLAY:`);
    console.log(`[STAGE 6]   video.srcObject=${video.srcObject ? 'PRESENT' : 'NULL'}`);
    console.log(`[STAGE 6]   video.readyState=${video.readyState}`);
    console.log(`[STAGE 6]   video.videoWidth=${video.videoWidth}`);
    console.log(`[STAGE 6]   video.videoHeight=${video.videoHeight}`);
    console.log(`[STAGE 6]   video.paused=${video.paused}`);
    console.log(`[STAGE 6]   video.muted=${video.muted}`);
    console.log(`[STAGE 6]   video.autoplay=${video.autoplay}`);
    console.log(`[STAGE 6]   video.playsInline=${video.playsInline}`);
    
    video.addEventListener('loadedmetadata', () => {
      console.log(`[STAGE 6] VIDEO EVENT: loadedmetadata`);
    });
    video.addEventListener('canplay', () => {
      console.log(`[STAGE 6] VIDEO EVENT: canplay`);
    });
    video.addEventListener('playing', () => {
      console.log(`[STAGE 6] VIDEO EVENT: playing`);
    });
    video.addEventListener('loadstart', () => {
      console.log(`[STAGE 6] VIDEO EVENT: loadstart`);
    });
    
    video.play()
      .then(() => {
        console.log(`[STAGE 6] VIDEO PLAY: SUCCESS`);
        setTimeout(() => {
          console.log(`[STAGE 6] VIDEO ELEMENT AFTER PLAY (100ms delay):`);
          console.log(`[STAGE 6]   video.readyState=${video.readyState}`);
          console.log(`[STAGE 6]   video.videoWidth=${video.videoWidth}`);
          console.log(`[STAGE 6]   video.videoHeight=${video.videoHeight}`);
          console.log(`[STAGE 6]   video.paused=${video.paused}`);
        }, 100);
      })
      .catch((err) => {
        console.error(`[STAGE 6] VIDEO PLAY: ERROR`, err);
      });

    return () => {
      if (video) video.srcObject = null;
    };
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted style={{ width: '100%', height: '160px', objectFit: 'cover' }} />;

}

const StudentCard = ({ session, onSelect }) => {
  const hasCritical = session.recentEvents?.some((e) => e.severity === 'critical');
  const hasWarning = session.recentEvents?.some((e) => e.severity === 'warning');
  const alertCount = session.recentEvents?.length || 0;

  return (
    <div
      className={`student-card ${hasCritical ? 'critical' : ''} ${hasWarning ? 'warning' : ''}`}
      onClick={onSelect}
    >
      <div className="student-avatar">
        {session.studentId?.name?.charAt(0).toUpperCase()}
      </div>

      <div className="student-info">
        <div className="student-name">{session.studentId?.name || 'Student'}</div>
        <div className="student-status">
          <span
            className="status-badge"
            style={{
              backgroundColor:
                session.monitoringStatus === 'active'
                  ? '#10b981'
                  : session.monitoringStatus === 'idle'
                  ? '#f59e0b'
                  : '#6b7280',
            }}
          >
            {session.monitoringStatus || 'unknown'}
          </span>
        </div>
      </div>

      <div className="student-indicators">
        {session.cameraEnabled ? (
          <Camera size={18} style={{ color: '#10b981' }} />
        ) : (
          <CameraOff size={18} style={{ color: '#ef4444' }} />
        )}
      </div>

      <div className="student-alerts">
        {hasCritical && (
          <AlertTriangle size={16} style={{ color: '#ef4444' }} />
        )}
        {hasWarning && (
          <AlertCircle size={16} style={{ color: '#f59e0b' }} />
        )}
        {alertCount > 0 && (
          <span className="alert-count">{alertCount}</span>
        )}
      </div>

      <div className="student-timer">
        {session.remainingSeconds && (
          <>
            <Clock size={14} />
            <span>{Math.floor(session.remainingSeconds / 60)}m</span>
          </>
        )}
      </div>
    </div>
  );
};

// Student Detail Panel
const StudentDetailPanel = ({ session, onClose }) => {
  return (
    <div className="student-detail-panel">
      <div className="detail-header">
        <div className="detail-avatar">
          {session.studentId?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="detail-title">
          <h2>{session.studentId?.name}</h2>
          <p>{session.studentId?.email}</p>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="detail-content">
        {/* Status Section */}
        <div className="detail-section">
          <h3>Current Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Monitoring Status</span>
              <span
                className="value"
                style={{
                  color:
                    session.monitoringStatus === 'active'
                      ? '#10b981'
                      : session.monitoringStatus === 'idle'
                      ? '#f59e0b'
                      : '#6b7280',
                }}
              >
                {session.monitoringStatus}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Connection</span>
              <span
                className="value"
                style={{
                  color: session.connectionStatus === 'connected' ? '#10b981' : '#ef4444',
                }}
              >
                {session.connectionStatus}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Camera</span>
              <span
                className="value"
                style={{
                  color: session.cameraEnabled ? '#10b981' : '#ef4444',
                }}
              >
                {session.cameraEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Time Remaining</span>
              <span className="value">
                {session.remainingSeconds
                  ? `${Math.floor(session.remainingSeconds / 60)}m ${session.remainingSeconds % 60}s`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="detail-section">
          <h3>Exam Progress</h3>
          <div className="progress-info">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((session.currentQuestionIndex || 0) / (session.examId?.totalQuestions || 1)) * 100}%`,
                }}
              ></div>
            </div>
            <div className="progress-text">
              Question {(session.currentQuestionIndex || 0) + 1} of {session.examId?.totalQuestions || '?'}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="detail-section">
          <h3>Recent Events ({session.recentEvents?.length || 0})</h3>
          <div className="events-list">
            {session.recentEvents?.slice(0, 5).map((event, idx) => (
              <div key={idx} className="event-item">
                <span
                  className="event-severity"
                  style={{
                    backgroundColor:
                      event.severity === 'critical'
                        ? '#ef4444'
                        : event.severity === 'warning'
                        ? '#f59e0b'
                        : '#10b981',
                  }}
                >
                  {event.severity.charAt(0).toUpperCase()}
                </span>
                <span className="event-type">{event.eventType}</span>
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInvigilation;
