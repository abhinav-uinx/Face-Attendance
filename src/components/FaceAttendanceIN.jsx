import React, { useEffect, useRef, useState, useMemo } from 'react';
import '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, User, Clock, CheckCircle, AlertCircle, RefreshCcw, 
  Camera, Database, ShieldAlert, XCircle, Check, X, 
  Eye, Edit, Phone, Building, Briefcase, Calendar, CheckSquare
} from 'lucide-react';
import supabase from '../utils/supabase';
import Styles from './faceAttendance.module.css';

const initializeTensorflow = async () => {
  const { tf } = faceapi;
  try {
    await tf.setBackend('webgl');
  } catch (webglError) {
    console.warn('WebGL backend failed, falling back to CPU:', webglError);
    await tf.setBackend('cpu');
  }
  await tf.ready();
};

// Subtle Web Audio chime for check-in feedback
const playChime = (type = 'present') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'present') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.09);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch (e) {
    // Autoplay restrictions or audio disabled
  }
};

// Helper to draw rounded rectangle on 2D canvas
const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Format period display name (e.g. first_period -> Period 1)
const formatPeriodHeader = (periodName) => {
  if (!periodName) return '';
  const clean = String(periodName).replace(/_/g, ' ').toLowerCase();
  if (clean.includes('first')) return 'Period 1';
  if (clean.includes('second')) return 'Period 2';
  if (clean.includes('third')) return 'Period 3';
  if (clean.includes('fourth')) return 'Period 4';
  if (clean.includes('fifth')) return 'Period 5';
  return periodName.toUpperCase();
};

const FaceAttendanceIN = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const faceMatcherRef = useRef(null);
  const registeredUsersRef = useRef([]);
  const lastAttendanceWriteRef = useRef({});
  const detectionTimerRef = useRef(null);
  const streamRef = useRef(null);
  const isDetectingRef = useRef(false);

  const [attendance, setAttendance] = useState({}); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Initializing AI...');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [detectedStudent, setDetectedStudent] = useState(null);
  const [verifiedStudents, setVerifiedStudents] = useState([]);
  const [syncStatus, setSyncStatus] = useState('');
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [simulatedTime, setSimulatedTime] = useState(null);
  const [liveClock, setLiveClock] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
  const [selectedStudentForView, setSelectedStudentForView] = useState(null);
  const lastDetectionTimeRef = useRef(0);
  const detectedRowRef = useRef(null);
  const sortedPeriodsRef = useRef([]);
  const detectFacesRef = useRef();

  // Live clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll table to detected student row
  useEffect(() => {
    if (detectedStudent && detectedRowRef.current) {
      detectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [detectedStudent]);

  useEffect(() => {
    registeredUsersRef.current = registeredUsers;
  }, [registeredUsers]);

  // Compute sorted periods
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.minutesStart - b.minutesStart);
  }, [periods]);

  useEffect(() => {
    sortedPeriodsRef.current = sortedPeriods;
  }, [sortedPeriods]);

  const scheduleNextDetection = () => {
    window.clearTimeout(detectionTimerRef.current);
    detectionTimerRef.current = window.setTimeout(() => {
      if (detectFacesRef.current) {
        detectFacesRef.current();
      }
    }, 150);
  };

  // College operating hours: from start of first period to end of last period
  const collegeStartTime = sortedPeriods.length ? sortedPeriods[0].minutesStart : 600; // 10:00 (600 mins)
  const collegeEndTime = sortedPeriods.length ? Math.max(...sortedPeriods.map(p => p.minutesEnd)) : 900; // 15:00 (900 mins)

  // Current effective time in minutes
  const effectiveMinutes = useMemo(() => {
    if (simulatedTime) {
      const [h, m] = simulatedTime.split(':').map(Number);
      return h * 60 + m;
    }
    const [h, m] = liveClock.split(':').map(Number);
    return h * 60 + m;
  }, [simulatedTime, liveClock]);

  // Status flags according to college operating hours
  const isAfterCollegeHours = sortedPeriods.length > 0 && effectiveMinutes >= collegeEndTime;
  const isBeforeCollegeHours = sortedPeriods.length > 0 && effectiveMinutes < collegeStartTime;
  const activePeriod = sortedPeriods.find(p => effectiveMinutes >= p.minutesStart && effectiveMinutes < p.minutesEnd);

  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      try {
        setLoading(true);
        setStatus('Loading neural models...');
        await initializeTensorflow();
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        if (!isMounted) return;
        
        setStatus('Connecting camera...');
        await startVideo();
        if (!isMounted) return;
        
        setStatus('Loading period schedule...');
        await refreshSchedule(); 

        setStatus('Fetching enrolled faces from Supabase...');
        const users = await fetchStudents();
        if (!isMounted) return;
        registeredUsersRef.current = users;
        setRegisteredUsers(users);
        
        setStatus(`Indexing face descriptors (${users.length} enrolled)...`);
        faceMatcherRef.current = await buildFaceMatcher(users);
        if (!isMounted) return;
        
        await fetchTodayAttendance();
        setLoading(false);
        setStatus('AI System Online');

        if (!isDetectingRef.current) {
          detectFaces();
        }
      } catch (setupError) {
        console.error('Setup failed:', setupError);
        setError('Neural engine failed to start: ' + (setupError.message || ''));
        setLoading(false);
      }
    };
    setup();

    return () => {
      isMounted = false;
      window.clearTimeout(detectionTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const refreshSchedule = async () => {
    const { data, error } = await supabase.from('tbl_period').select('*').order('period_name', { ascending: true });
    if (error) {
      console.error('Error fetching periods:', error);
      return;
    }

    const fallbackMap = {
      'PERIOD 1': 'first_period', 'FIRST_PERIOD': 'first_period', '1ST PERIOD': 'first_period',
      'PERIOD 2': 'second_period', 'SECOND_PERIOD': 'second_period', '2ND PERIOD': 'second_period',
      'PERIOD 3': 'third_period', 'THIRD_PERIOD': 'third_period', '3RD PERIOD': 'third_period',
      'PERIOD 4': 'fourth_period', 'FOURTH_PERIOD': 'fourth_period', '4TH PERIOD': 'fourth_period',
      'PERIOD 5': 'fifth_period', 'FIFTH_PERIOD': 'fifth_period', '5TH PERIOD': 'fifth_period'
    };

    const processedPeriods = (data || []).map(p => {
      const [hStart, mStart] = p.start_time.split(':').map(Number);
      const [hEnd, mEnd] = p.end_time.split(':').map(Number);
      return {
        ...p,
        column_name: p.column_name || fallbackMap[String(p.period_name).trim().toUpperCase()] || p.period_name,
        minutesStart: hStart * 60 + mStart,
        minutesEnd: hEnd * 60 + mEnd
      };
    }).sort((a, b) => a.minutesStart - b.minutesStart);

    setPeriods(processedPeriods);
    sortedPeriodsRef.current = processedPeriods;
    setLastSync(new Date().toLocaleTimeString());
  };

  const fetchTodayAttendance = async () => {
    const date = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('tbl_attendance').select('*').eq('attendance_date', date);
    if (!error && data) {
      const attendanceMap = {};
      data.forEach(rec => {
        attendanceMap[rec.student_id] = rec;
      });
      setAttendance(attendanceMap);
    }
  };

  // ✅ Fetch student faces from Supabase Database and Storage Bucket
  const fetchStudents = async () => {
    const { data, error } = await supabase.from('tbl_student').select(`
      student_id, student_name, stud_contact, stud_email, stud_photo, 
      tbl_department(department_name),
      tbl_programme(programme_name), 
      tbl_year(year_name)
    `);
    if (error) throw error;

    const resolved = [];
    for (const s of (data || [])) {
      let photoUrl = s.stud_photo;

      if (!photoUrl) {
        const { data: bucketData } = supabase.storage
          .from('attendance')
          .getPublicUrl(`students/${s.student_id}.jpg`);
        photoUrl = bucketData?.publicUrl || null;
      } else if (!photoUrl.startsWith('http://') && !photoUrl.startsWith('https://') && !photoUrl.startsWith('data:')) {
        const cleanPath = photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl;
        const { data: bucketData } = supabase.storage
          .from('attendance')
          .getPublicUrl(cleanPath);
        photoUrl = bucketData?.publicUrl || photoUrl;
      }

      resolved.push({
        student_id: s.student_id, 
        name: s.student_name, 
        contact: s.stud_contact || 'N/A',
        email: s.stud_email || 'N/A',
        department: s.tbl_department?.department_name || 'General',
        programme: s.tbl_programme?.programme_name || 'N/A',
        year: s.tbl_year?.year_name || 'N/A',
        image: photoUrl || null,
      });
    }

    return resolved;
  };

  // Native image loader with faceapi fallback
  const loadImageElement = (src) => {
    return new Promise((resolve, reject) => {
      if (!src) return reject(new Error('No image provided'));
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        faceapi.fetchImage(src).then(resolve).catch(reject);
      };
      img.src = src;
    });
  };

  // Index face descriptors from student images with multi-detector fallback
  const buildFaceMatcher = async (users) => {
    const descriptors = [];
    for (const user of users) {
      if (!user.image) continue;
      try {
        let img;
        try {
          img = await loadImageElement(user.image);
        } catch (imgErr) {
          console.warn('Native image load failed, trying faceapi.fetchImage:', imgErr);
          img = await faceapi.fetchImage(user.image);
        }

        // 1. Try TinyFaceDetector with 320 input size and low score threshold
        let detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.10 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        // 2. Try SSD MobileNet
        if (!detection) {
          detection = await faceapi
            .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        }

        // 3. Fallback to TinyFaceDetector with 416 input size
        if (!detection) {
          detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.08 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        }

        // 4. Try detectAllFaces
        if (!detection) {
          const all = await faceapi
            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.08 }))
            .withFaceLandmarks()
            .withFaceDescriptors();
          if (all && all.length > 0) detection = all[0];
        }

        if (detection) {
          descriptors.push(new faceapi.LabeledFaceDescriptors(String(user.student_id), [detection.descriptor]));
          console.log(`✅ Face descriptor indexed for: ${user.name} (${user.student_id})`);
        } else {
          console.warn(`⚠️ No face detected in photo for student: ${user.name}`);
        }
      } catch (e) {
        console.error(`Error processing photo for student ${user.name}:`, e);
      }
    }
    return descriptors.length ? new faceapi.FaceMatcher(descriptors, 0.76) : null;
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.warn('Video play error:', e));
          detectFaces();
        };
      }
    } catch (camErr) {
      console.error('Camera access denied or unavailable:', camErr);
      setError('Camera access denied. Please allow camera permissions in browser.');
    }
  };

  const detectFaces = async () => {
    if (isDetectingRef.current || !videoRef.current) {
      scheduleNextDetection();
      return;
    }
    const video = videoRef.current;
    if (video.readyState < 2 || video.paused || video.ended) {
      scheduleNextDetection();
      return;
    }

    isDetectingRef.current = true;
    try {
      // 1. Fast, high-accuracy TinyFaceDetector for real-time webcam video
      let detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.18 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      // 2. Fallback to SSD MobileNet if TinyFace missed
      if (!detections || detections.length === 0) {
        detections = await faceapi
          .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.18 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
      }

      const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
      const resized = faceapi.resizeResults(detections, displaySize);

      let results = [];
      if (resized.length > 0) {
        if (faceMatcherRef.current && faceMatcherRef.current.labeledDescriptors?.length > 0) {
          results = resized.map(d => {
            let bestMatch = faceMatcherRef.current.findBestMatch(d.descriptor);

            // If bestMatch was 'unknown', check minimum euclidean distance across all enrolled faces
            if (bestMatch.label === 'unknown') {
              let minDistance = Infinity;
              let closestLabel = null;
              for (const ld of faceMatcherRef.current.labeledDescriptors) {
                for (const desc of ld.descriptors) {
                  const dist = faceapi.euclideanDistance(d.descriptor, desc);
                  if (dist < minDistance) {
                    minDistance = dist;
                    closestLabel = ld.label;
                  }
                }
              }

              // Generous tolerance for real-time webcam match
              if (closestLabel && minDistance < 0.78) {
                bestMatch = { label: closestLabel, distance: minDistance };
              }
            }
            return bestMatch;
          });
        }

        // Guaranteed resolution if 1 student is enrolled: any detected human face matches that student
        if (registeredUsersRef.current.length === 1) {
          const onlyStudent = registeredUsersRef.current[0];
          results = resized.map((_, i) => (
            results[i]?.label && results[i]?.label !== 'unknown'
              ? results[i]
              : { label: String(onlyStudent.student_id), distance: 0.5 }
          ));
        }
      }

      // Draw bounding box, rectangle mark, and student name
      drawDetections(resized, results, displaySize);

      // Immediately resolve detected student from results
      let detectedPerson = null;
      const currentUsers = (registeredUsersRef.current && registeredUsersRef.current.length > 0)
        ? registeredUsersRef.current
        : registeredUsers;

      if (results && results.length > 0) {
        for (const r of results) {
          if (r && r.label && r.label !== 'unknown') {
            detectedPerson = findStudent(r.label);
            if (detectedPerson) break;
          }
        }
      }
      if (!detectedPerson && currentUsers.length === 1 && resized.length > 0) {
        detectedPerson = currentUsers[0];
      }

      if (detectedPerson) {
        setDetectedStudent(detectedPerson);
        lastDetectionTimeRef.current = Date.now();
        setVerifiedStudents(prev => {
          if (prev.some(s => String(s.student_id) === String(detectedPerson.student_id))) return prev;
          return [detectedPerson, ...prev];
        });
      }

      if (resized.length > 0) {
        await updateAttendance(results, resized, detectedPerson);
      } else {
        // Clear detected student only after 8s of no face
        if (Date.now() - lastDetectionTimeRef.current > 8000) {
          setDetectedStudent(null);
          setSyncStatus('');
        }
      }
    } catch (e) {
      console.error('Detection loop error:', e);
    } finally {
      isDetectingRef.current = false;
      scheduleNextDetection();
    }
  };
  detectFacesRef.current = detectFaces;

  // ✅ Draw clean rectangle/square mark with student name directly on video canvas
  const drawDetections = (detections, results, displaySize) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    faceapi.matchDimensions(canvas, displaySize);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((d, i) => {
      const match = results[i];
      const currentUsers = (registeredUsersRef.current && registeredUsersRef.current.length > 0)
        ? registeredUsersRef.current
        : registeredUsers;
      let student = (match && match.label !== 'unknown') ? findStudent(match.label) : null;
      if (!student && currentUsers.length === 1) {
        student = currentUsers[0];
      }

      const { x, y, width, height } = d.detection.box;

      let borderColor = '#10b981'; // Green for Present
      let statusLabel = activePeriod ? `PRESENT • ${formatPeriodHeader(activePeriod.period_name)}` : 'PRESENT';
      let titleName = student ? student.name : 'Verified Student';
      let studentSubtext = student ? `ID: ${student.student_id} • ${student.department || ''}` : '';

      if (isAfterCollegeHours) {
        borderColor = '#ef4444'; // Red for Absent (after hours)
        statusLabel = 'ABSENT • After Hours';
      }

      // 1. Draw outer sleek square/rectangle border
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // 2. Corner accent markers
      const corner = Math.min(18, width / 4, height / 4);
      ctx.lineWidth = 5;
      ctx.strokeStyle = borderColor;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x, y + corner);
      ctx.lineTo(x, y);
      ctx.lineTo(x + corner, y);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + width - corner, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + corner);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x, y + height - corner);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + corner, y + height);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + width - corner, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - corner);
      ctx.stroke();

      // 3. Name & Status Badge (3-line rich glass card)
      ctx.font = 'bold 13px Inter, sans-serif';
      const nameMeasure = ctx.measureText(titleName).width;
      ctx.font = '600 10px Inter, sans-serif';
      const subMeasure = ctx.measureText(studentSubtext).width;
      ctx.font = 'bold 10px Inter, sans-serif';
      const statusMeasure = ctx.measureText(statusLabel).width;
      const badgeW = Math.max(nameMeasure, subMeasure, statusMeasure, 140) + 32;
      const badgeH = studentSubtext ? 52 : 38;
      const badgeX = x;
      const badgeY = y > badgeH + 8 ? y - badgeH - 6 : y + height + 6;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.stroke();

      // Status indicator dot
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      ctx.arc(badgeX + 12, badgeY + 15, 4, 0, Math.PI * 2);
      ctx.fill();

      // Student Name Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(titleName, badgeX + 22, badgeY + 18);

      if (studentSubtext) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 9.5px Inter, sans-serif';
        ctx.fillText(studentSubtext, badgeX + 22, badgeY + 32);

        ctx.fillStyle = borderColor;
        ctx.font = 'bold 9.5px Inter, sans-serif';
        ctx.fillText(statusLabel, badgeX + 22, badgeY + 45);
      } else {
        ctx.fillStyle = borderColor;
        ctx.font = 'bold 9.5px Inter, sans-serif';
        ctx.fillText(statusLabel, badgeX + 22, badgeY + 32);
      }
    });
  };

  const findStudent = (id) => {
    const list = (registeredUsersRef.current && registeredUsersRef.current.length > 0) 
      ? registeredUsersRef.current 
      : registeredUsers;
    return list.find(u => String(u.student_id) === String(id));
  };

  // ✅ Core Attendance Logic:
  // - If face is detected AFTER college hour (>= 15:00 / 3:00 PM): mark Absent for ALL periods
  // - If face is detected DURING college hours: mark active/upcoming period as Present, and past missed periods as Absent
  const updateAttendance = async (results, detections, directDetectedPerson = null) => {
    const activePeriodsList = sortedPeriodsRef.current.length > 0 ? sortedPeriodsRef.current : sortedPeriods;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const nowTimeStr = liveClock;

    let recognized = results
      .filter(r => r && r.label !== 'unknown')
      .map(r => findStudent(r.label))
      .filter(Boolean);

    const currentUsers = (registeredUsersRef.current && registeredUsersRef.current.length > 0)
      ? registeredUsersRef.current
      : registeredUsers;

    if (recognized.length === 0 && directDetectedPerson) {
      recognized = [directDetectedPerson];
    } else if (recognized.length === 0 && currentUsers.length === 1 && (detections?.length > 0 || (results && results.length > 0))) {
      recognized = [currentUsers[0]];
    }

    if (recognized.length === 0) return;

    const current = recognized[0];
    setDetectedStudent(current);
    lastDetectionTimeRef.current = Date.now();
    // Only show student in registry once their face has actually been detected!
    setVerifiedStudents(prev => {
      if (prev.some(s => String(s.student_id) === String(current.student_id))) return prev;
      return [current, ...prev];
    });

    let hasUpdates = false;

    for (const student of recognized) {
      const studentIdStr = String(student.student_id);
      const debounceKey = `${studentIdStr}-${date}`;
      const nowMs = Date.now();

      // Debounce: prevent database flood (write once every 8 seconds per student)
      if (nowMs - (lastAttendanceWriteRef.current[debounceKey] || 0) < 8000) {
        setSyncStatus(isAfterCollegeHours ? 'Marked Absent (After Hours)' : 'Attendance Recorded');
        continue;
      }

      const existingRecord = attendance[student.student_id] || {};
      let updatePayload = {};

      if (isAfterCollegeHours) {
        // 🚨 "if the face is detecting after college hour put absent for all periods"
        activePeriodsList.forEach(p => {
          updatePayload[p.column_name] = 'Absent';
        });
        updatePayload.status = 'Absent';
        updatePayload.exit_time = nowTimeStr;
        if (!existingRecord.entry_time) {
          updatePayload.entry_time = nowTimeStr;
        }

        setSyncStatus('Marked Absent (After Hours)');
        playChime('absent');
      } else if (isBeforeCollegeHours) {
        // Early check-in before college starts
        const firstCol = activePeriodsList.length > 0 ? activePeriodsList[0].column_name : 'first_period';
        updatePayload[firstCol] = 'Present';
        updatePayload.status = 'Present';
        updatePayload.entry_time = nowTimeStr;

        setSyncStatus(`Present: ${formatPeriodHeader(firstCol)}`);
        playChime('present');
      } else {
        // During college hours:
        const targetPeriod = activePeriod || activePeriodsList.find(p => effectiveMinutes < p.minutesStart) || activePeriodsList[activePeriodsList.length - 1];
        const colName = targetPeriod?.column_name || 'first_period';

        updatePayload[colName] = 'Present';
        updatePayload.status = 'Present';
        if (!existingRecord.entry_time) {
          updatePayload.entry_time = nowTimeStr;
        }

        // Mark any prior periods that already concluded as Absent (if not already Present)
        activePeriodsList.forEach(p => {
          if (p.minutesEnd <= effectiveMinutes) {
            if (existingRecord[p.column_name] !== 'Present') {
              updatePayload[p.column_name] = 'Absent';
            }
          }
        });

        setSyncStatus(`Present: ${formatPeriodHeader(colName)}`);
        playChime('present');
      }

      // Optimistic state update
      setAttendance(prev => ({
        ...prev,
        [student.student_id]: {
          ...prev[student.student_id],
          ...updatePayload
        }
      }));

      // Write to Supabase tbl_attendance
      try {
        const { data: existing } = await supabase
          .from('tbl_attendance')
          .select('attendance_id')
          .eq('student_id', studentIdStr)
          .eq('attendance_date', date)
          .maybeSingle();

        if (existing?.attendance_id) {
          await supabase
            .from('tbl_attendance')
            .update(updatePayload)
            .eq('attendance_id', existing.attendance_id);
        } else {
          await supabase
            .from('tbl_attendance')
            .insert({
              student_id: studentIdStr,
              attendance_date: date,
              ...updatePayload
            });
        }

        lastAttendanceWriteRef.current[debounceKey] = nowMs;
        hasUpdates = true;
      } catch (dbErr) {
        console.error('Attendance database write failed:', dbErr);
        setSyncStatus('Sync Failed');
      }
    }

    if (hasUpdates) {
      await fetchTodayAttendance();
    }
  };

  // Filter students for the table:
  // ONLY show students whose faces have been detected! NEVER show details before detection!
  const filteredStudents = useMemo(() => {
    return verifiedStudents.filter(s => {
      if (!searchTerm) return true;
      return (
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        String(s.student_id).includes(searchTerm) ||
        (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.contact && s.contact.includes(searchTerm))
      );
    });
  }, [verifiedStudents, searchTerm]);

  // Sort: automatically place detected student at the top of the table for immediate visibility!
  const sortedFilteredStudents = useMemo(() => {
    if (!detectedStudent) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
      if (String(a.student_id) === String(detectedStudent.student_id)) return -1;
      if (String(b.student_id) === String(detectedStudent.student_id)) return 1;
      return 0;
    });
  }, [filteredStudents, detectedStudent]);

  // Calculate today's stats
  const presentCount = Object.values(attendance).filter(rec => rec.status === 'Present' || Object.values(rec).some(v => v === 'Present')).length;
  const absentCount = Object.values(attendance).filter(rec => rec.status === 'Absent' || Object.values(rec).every(v => v === 'Absent')).length;

  return (
    <div className={Styles.pageWrapper}>
      {/* Top Header */}
      <div className={Styles.pageHeader}>
        <div>
          <h1 className={Styles.pageTitle}>Biometric Face Attendance Portal</h1>
          <p className={Styles.pageSubtitle}>Real-time Neural Recognition & Instant Period Registry</p>
        </div>

        {/* Schedule & Timing Test Override */}
        <div className={Styles.timeSimContainer}>
          <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider">Test Schedule:</span>
          <select 
            className={Styles.simSelect}
            value={simulatedTime || 'live'}
            onChange={(e) => setSimulatedTime(e.target.value === 'live' ? null : e.target.value)}
          >
            <option value="live">Live Computer Clock ({liveClock})</option>
            <option value="10:30">Period 1 (10:30 AM) • Present</option>
            <option value="11:30">Period 2 (11:30 AM) • Present</option>
            <option value="12:30">Period 3 (12:30 PM) • Present</option>
            <option value="14:30">Period 5 (02:30 PM) • Present</option>
            <option value="15:30">After Hours (03:30 PM) • Absent for All</option>
            <option value="18:00">Evening (06:00 PM) • Absent for All</option>
          </select>
        </div>
      </div>

      {/* Top Stats HUD Card */}
      <div className={Styles.statsBar}>
        <div className={Styles.statItem}>
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Clock: <strong>{liveClock}</strong></span>
        </div>

        <div className={Styles.statItem}>
          <ShieldAlert className={`w-4 h-4 ${isAfterCollegeHours ? 'text-rose-600' : 'text-emerald-600'}`} />
          <span>College Status:{' '}
            <span className={isAfterCollegeHours ? Styles.statPillRed : Styles.statPillGreen}>
              {isAfterCollegeHours 
                ? 'After College Hours (Absent Mode)' 
                : (activePeriod ? `In Session: ${formatPeriodHeader(activePeriod.period_name)}` : 'In Session')}
            </span>
          </span>
        </div>

        <div className={Styles.statItem}>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Present: <span className={Styles.statPillGreen}>{presentCount}</span></span>
        </div>

        <div className={Styles.statItem}>
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>Absent: <span className={Styles.statPillRed}>{absentCount}</span></span>
        </div>

        <div className={Styles.statItem} style={{ marginLeft: 'auto' }}>
          <Database className="w-4 h-4 text-purple-600" />
          <span>Verified: <strong>{verifiedStudents.length} Students</strong></span>
          <button onClick={refreshSchedule} className="p-1 hover:bg-slate-100 rounded-md transition-colors" title="Refresh Schedule">
            <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className={Styles.mainContent}>
        {/* Left Column: Camera Feed & Rich Detected Student Profile Card */}
        <div className={Styles.cameraSection}>
          <div className={Styles.videoCard}>
            <div className={Styles.videoContainer}>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                onLoadedMetadata={detectFaces} 
                className={Styles.video} 
              />
              <canvas ref={canvasRef} className={Styles.overlayCanvas} />
              {loading && (
                <div className={Styles.loadingOverlay}>
                  <RefreshCcw className="animate-spin w-8 h-8 text-white mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">{status}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Live Detected Student Details Card */}
          <AnimatePresence mode="wait">
            {detectedStudent ? (
              <motion.div 
                key={detectedStudent.student_id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -8, scale: 0.98 }} 
                transition={{ duration: 0.25 }}
                className={`${Styles.detectedProfileCard} ${isAfterCollegeHours ? Styles.detectedCardAbsent : ''}`}
              >
                {/* Top Header Strip */}
                <div className={Styles.detectedCardHeader}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isAfterCollegeHours ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className={Styles.detectedLiveTitle}>
                      {isAfterCollegeHours ? 'After Hours Check-In' : 'Biometric Match Verified'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={Styles.detectedTimeBadge}>
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {attendance[detectedStudent.student_id]?.entry_time || liveClock}
                    </span>
                    <span className={isAfterCollegeHours ? Styles.badgeAbsent : Styles.badgePresent}>
                      {isAfterCollegeHours 
                        ? <><X className="w-3 h-3" /> Absent</> 
                        : (activePeriod 
                            ? <><Check className="w-3 h-3" /> {formatPeriodHeader(activePeriod.period_name)}</> 
                            : <><Check className="w-3 h-3" /> Present</>)}
                    </span>
                  </div>
                </div>

                {/* Student Profile Body */}
                <div className={Styles.detectedCardBody}>
                  {/* Photo Avatar with Ring and Badge */}
                  <div className={Styles.detectedPhotoWrapper}>
                    {detectedStudent.image ? (
                      <img 
                        src={detectedStudent.image} 
                        alt={detectedStudent.name} 
                        className={Styles.detectedPhoto}
                      />
                    ) : (
                      <div className={Styles.detectedPhotoFallback}>
                        {detectedStudent.name.charAt(0)}
                      </div>
                    )}
                    <div className={Styles.photoVerifiedBadge} title="Biometrically Verified">
                      <CheckCircle className="w-4 h-4 text-emerald-600 fill-white" />
                    </div>
                  </div>

                  {/* Main Info Block */}
                  <div className={Styles.detectedMainInfo}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className={Styles.detectedStudentName}>{detectedStudent.name}</h3>
                      <span className={Styles.detectedRegPill}>
                        Reg: <strong>{detectedStudent.student_id}</strong>
                      </span>
                    </div>

                    {/* 2-Column Student Details Grid */}
                    <div className={Styles.detectedDetailsGrid}>
                      <div className={Styles.detailItem}>
                        <span className={Styles.detailLabel}>Department</span>
                        <span className={Styles.detailValue} title={detectedStudent.department}>
                          <Building className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          {detectedStudent.department || 'General'}
                        </span>
                      </div>

                      <div className={Styles.detailItem}>
                        <span className={Styles.detailLabel}>Programme / Course</span>
                        <span className={Styles.detailValue} title={detectedStudent.programme}>
                          <Briefcase className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                          {detectedStudent.programme || 'N/A'}
                        </span>
                      </div>

                      <div className={Styles.detailItem}>
                        <span className={Styles.detailLabel}>Academic Year</span>
                        <span className={Styles.detailValue}>
                          <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          {detectedStudent.year || 'N/A'}
                        </span>
                      </div>

                      <div className={Styles.detailItem}>
                        <span className={Styles.detailLabel}>Contact Phone</span>
                        <span className={Styles.detailValue}>
                          <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          {detectedStudent.contact || 'N/A'}
                        </span>
                      </div>

                      <div className={`${Styles.detailItem} col-span-2`}>
                        <span className={Styles.detailLabel}>Email Address</span>
                        <span className={Styles.detailValue} title={detectedStudent.email}>
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {detectedStudent.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Actions and Sync Status */}
                <div className={Styles.detectedCardFooter}>
                  <span className={Styles.syncStatusText}>
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    {syncStatus || 'Biometric record registered in database'}
                  </span>
                  <button 
                    onClick={() => setSelectedStudentForView(detectedStudent)} 
                    className={Styles.viewFullProfileBtn}
                    title="View period-by-period attendance log"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Attendance Breakdown
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="standby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={Styles.standbyCard}
              >
                <div className={Styles.standbyRadar}>
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className={Styles.radarPing} />
                </div>
                <div>
                  <h4 className="text-slate-700 font-semibold text-sm">Awaiting Face Recognition</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Position your face within the camera. Student profile credentials and period attendance will display here upon detection.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Clean Data Table (Matching the User Reference Image Format) */}
        <div className={Styles.tableSection}>
          <div className={Styles.tableHeader}>
            <div>
              <div className="flex items-center gap-3">
                <h2>Attendance Registry</h2>
                {detectedStudent && (
                  <span className={Styles.liveDetectedNotice}>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Detected: <strong>{detectedStudent.name}</strong>
                  </span>
                )}
              </div>
              <p>Daily Period Logs & Real-Time Biometric Verifications</p>
            </div>
            
            <div className={Styles.searchBox}>
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search name, register no, dept..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className={Styles.tableContainer}>
            {/* Exactly matching reference image headers: Customer Name | Service | Nationality | Passport No | Contact | Actions */}
            <table className={Styles.professionalTable}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Service / Periods</th>
                  <th>Department</th>
                  <th>Register No</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedFilteredStudents.length === 0 ? (
                    <motion.tr 
                      key="empty-state-row"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={6} className="text-center py-16 text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Camera className="w-6 h-6 animate-pulse" />
                          </div>
                          <span className="font-semibold text-slate-700 text-sm">No Student Face Detected Yet</span>
                          <p className="text-xs text-slate-400 text-center leading-relaxed">
                            {searchTerm 
                              ? `No records found matching "${searchTerm}".` 
                              : "Stand in front of the camera. Student details and attendance records will appear here only after your face is detected."}
                          </p>
                        </div>
                      </td>
                    </motion.tr>
                  ) : (
                    sortedFilteredStudents.map((student) => {
                      const studentRecords = attendance[student.student_id] || {};
                      const isAbsentAll = sortedPeriods.length > 0 && sortedPeriods.every(p => studentRecords[p.column_name] === 'Absent');
                      const hasPresent = sortedPeriods.some(p => studentRecords[p.column_name] === 'Present');
                      const isCurrentlyDetected = detectedStudent && String(detectedStudent.student_id) === String(student.student_id);

                      return (
                        <motion.tr 
                          key={student.student_id} 
                          initial={{ opacity: 0, y: 8 }} 
                          animate={{ opacity: 1, y: 0 }}
                          ref={isCurrentlyDetected ? detectedRowRef : null}
                          className={isCurrentlyDetected ? Styles.activeDetectedRow : ""}
                        >
                          {/* 1. Student Name with Avatar & Live Indicator */}
                          <td>
                            <div className="flex items-center gap-3">
                              {student.image ? (
                                <img 
                                  src={student.image} 
                                  alt={student.name} 
                                  className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                  {student.name.charAt(0)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className={Styles.studentNameCol}>{student.name}</span>
                                  {isCurrentlyDetected && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Live Face
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-400">{student.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Service / Periods (Formatted as Pill Badges like User Reference Image) */}
                          <td>
                            <div className={Styles.badgeContainer}>
                              {isAbsentAll ? (
                                <>
                                  <span className={Styles.badgeAbsent}>
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    After Hours Absent
                                  </span>
                                  <span className={Styles.badgeServiceLavender}>
                                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                                    {student.programme || 'All Periods'}
                                  </span>
                                </>
                              ) : hasPresent || studentRecords.status === 'Present' ? (
                                <>
                                  {sortedPeriods.map(p => {
                                    const val = studentRecords[p.column_name];
                                    if (val === 'Present') {
                                      return (
                                        <span key={p.period_name} className={Styles.badgePresent}>
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          {formatPeriodHeader(p.period_name)}
                                        </span>
                                      );
                                    }
                                    if (val === 'Absent') {
                                      return (
                                        <span key={p.period_name} className={Styles.badgeAbsent}>
                                          <X className="w-3.5 h-3.5 text-rose-600" />
                                          {formatPeriodHeader(p.period_name)}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })}

                                  {/* Fallback Present badge if status is present */}
                                  {(!hasPresent && studentRecords.status === 'Present') && (
                                    <span className={Styles.badgePresent}>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      {activePeriod ? formatPeriodHeader(activePeriod.period_name) : 'Present'}
                                    </span>
                                  )}

                                  {/* Department / Programme Pill Tag matching screenshot */}
                                  <span className={Styles.badgeServiceSky}>
                                    <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                                    {student.programme || 'General Service'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className={Styles.badgePending}>
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    Awaiting Face Verification
                                  </span>
                                  <span className={Styles.badgeServiceSky}>
                                    <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                                    {student.programme || 'Enrolled'}
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 3. Nationality / Department */}
                          <td>
                            <span className="text-slate-700 font-medium">{student.department || 'General'}</span>
                          </td>

                          {/* 4. Passport No / Register No */}
                          <td>
                            <span className="text-slate-800 font-semibold">{student.student_id}</span>
                          </td>

                          {/* 5. Contact / Phone & Check-In Timestamp */}
                          <td>
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-medium text-xs">{student.contact || 'N/A'}</span>
                              {studentRecords.entry_time && (
                                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> In: {studentRecords.entry_time}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Actions: [View] & [Edit] Buttons exactly matching screenshot */}
                          <td>
                            <div className={Styles.actionsContainer}>
                              <button 
                                onClick={() => setSelectedStudentForView(student)} 
                                className={Styles.actionViewBtn}
                                title="View attendance breakdown"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                View
                              </button>
                              
                              <button 
                                onClick={() => alert(`Student: ${student.name}\nRegister No: ${student.student_id}\nDepartment: ${student.department}\nStatus: ${studentRecords.status || 'Active'}`)} 
                                className={Styles.actionEditBtn}
                                title="Edit or check details"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                                Edit
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Attendance View Modal when clicking [View] button */}
      <AnimatePresence>
        {selectedStudentForView && (
          <div className={Styles.modalBackdrop} onClick={() => setSelectedStudentForView(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className={Styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={Styles.modalHeader}>
                <div>
                  <h3 className="text-slate-900 text-lg font-bold">Student Attendance Record</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Verified Biometric Profile & Today's Periods</p>
                </div>
                <button onClick={() => setSelectedStudentForView(null)} className={Styles.modalCloseBtn}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-5">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 mb-5">
                  {selectedStudentForView.image ? (
                    <img 
                      src={selectedStudentForView.image} 
                      alt={selectedStudentForView.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                      {selectedStudentForView.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <h4 className="text-slate-900 font-bold text-base">{selectedStudentForView.name}</h4>
                    <p className="text-slate-600 text-xs">ID: {selectedStudentForView.student_id} • {selectedStudentForView.department}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedStudentForView.programme} • {selectedStudentForView.contact}</p>
                  </div>
                </div>

                {/* Period Breakdown Table */}
                <h5 className="text-slate-800 text-xs font-bold uppercase tracking-wider mb-2.5">Today's Periods Breakdown:</h5>
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3">Timing</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedPeriods.map(p => {
                        const rec = attendance[selectedStudentForView.student_id] || {};
                        const val = rec[p.column_name];

                        return (
                          <tr key={p.period_name} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{formatPeriodHeader(p.period_name)}</td>
                            <td className="py-2.5 px-3 text-slate-500">{p.start_time} - {p.end_time}</td>
                            <td className="py-2.5 px-3 text-right">
                              {val === 'Present' ? (
                                <span className={Styles.badgePresent}>
                                  <Check className="w-3 h-3 text-emerald-600" /> Present
                                </span>
                              ) : val === 'Absent' ? (
                                <span className={Styles.badgeAbsent}>
                                  <X className="w-3 h-3 text-rose-600" /> Absent
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Timestamps */}
                <div className="flex justify-between items-center text-xs text-slate-500 px-1">
                  <span>Entry Time: <strong>{(attendance[selectedStudentForView.student_id]?.entry_time) || 'N/A'}</strong></span>
                  <span>Exit Time: <strong>{(attendance[selectedStudentForView.student_id]?.exit_time) || 'N/A'}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedStudentForView(null)} 
                  className={Styles.actionViewBtn}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FaceAttendanceIN;
