import React, { useEffect, useRef, useState } from 'react';
import '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Clock, CheckCircle, AlertCircle, RefreshCcw, Camera, Smile, Database } from 'lucide-react';
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
  const [detectedExpression, setDetectedExpression] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [lastSync, setLastSync] = useState(null);

  const DEFAULT_COLUMNS = ['first_period', 'second_period', 'third_period', 'fourth_period', 'fifth_period'];

  useEffect(() => {
    registeredUsersRef.current = registeredUsers;
  }, [registeredUsers]);

  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      try {
        setLoading(true);
        setStatus('Loading neural networks...');
        await initializeTensorflow();
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models'),
        ]);
        if (!isMounted) return;
        
        setStatus('Waking up camera...');
        await startVideo();
        if (!isMounted) return;
        
        setLoading(false);
        setStatus('Syncing Schedule...');
        await refreshSchedule(); 

        setStatus('Loading students...');
        const users = await fetchStudents();
        if (!isMounted) return;
        setRegisteredUsers(users);
        
        setStatus('Indexing face descriptors...');
        faceMatcherRef.current = await buildFaceMatcher(users);
        if (!isMounted) return;
        
        await fetchTodayAttendance();
        setStatus('AI System Online');
      } catch (setupError) {
        console.error('Setup failed:', setupError);
        setError('Neural engine failed to start.');
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

    const processedPeriods = data.map(p => {
        const [hStart, mStart] = p.start_time.split(':').map(Number);
        const [hEnd, mEnd] = p.end_time.split(':').map(Number);
        return {
            ...p,
            column_name: p.column_name || fallbackMap[String(p.period_name).trim().toUpperCase()],
            minutesStart: hStart * 60 + mStart,
            minutesEnd: hEnd * 60 + mEnd
        };
    });
    setPeriods(processedPeriods);
    setLastSync(new Date().toLocaleTimeString());
  };

  const fetchTodayAttendance = async () => {
    const date = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('tbl_attendance').select('*').eq('attendance_date', date);
    if (data) {
      const attendanceMap = {};
      data.forEach(rec => {
        attendanceMap[rec.student_id] = rec;
      });
      setAttendance(attendanceMap);
    }
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase.from('tbl_student').select(`
      student_id, student_name, stud_photo, 
      tbl_programme(programme_name), tbl_year(year_name)
    `);
    if (error) throw error;
    return (data || []).filter(s => s.stud_photo).map(s => ({
      student_id: s.student_id, 
      name: s.student_name, 
      image: s.stud_photo,
      programmeYear: `${s.tbl_programme?.programme_name || 'N/A'} - ${s.tbl_year?.year_name || 'N/A'}`,
    }));
  };

  const buildFaceMatcher = async (users) => {
    const descriptors = [];
    for (const user of users) {
      try {
        const img = await faceapi.fetchImage(user.image);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        if (detection) descriptors.push(new faceapi.LabeledFaceDescriptors(String(user.student_id), [detection.descriptor]));
      } catch (e) { console.error(e); }
    }
    return descriptors.length ? new faceapi.FaceMatcher(descriptors, 0.6) : null;
  };

  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  };

  const detectFaces = async () => {
    if (isDetectingRef.current || !videoRef.current) {
      detectionTimerRef.current = setTimeout(detectFaces, 200);
      return;
    }
    const video = videoRef.current;
    if (video.readyState < 2) {
      detectionTimerRef.current = setTimeout(detectFaces, 200);
      return;
    }
    isDetectingRef.current = true;
    try {
      const detections = await faceapi.detectAllFaces(video)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptors();
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      const resized = faceapi.resizeResults(detections, displaySize);
      if (!faceMatcherRef.current) {
        isDetectingRef.current = false;
        detectionTimerRef.current = setTimeout(detectFaces, 200);
        return;
      }
      const results = resized.map(d => faceMatcherRef.current.findBestMatch(d.descriptor));
      drawDetections(resized, results, displaySize);
      if (results.length) {
        const expressions = resized[0].expressions;
        const mood = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        setDetectedExpression(mood === 'neutral' ? '' : mood);
        await updateAttendance(results);
      } else {
        setDetectedStudent(null);
        setDetectedExpression('');
        setSyncStatus('');
      }
    } catch (e) { console.error(e); } finally {
      isDetectingRef.current = false;
      detectionTimerRef.current = setTimeout(detectFaces, 200);
    }
  };

  const drawDetections = (detections, results, displaySize) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    faceapi.matchDimensions(canvas, displaySize);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detections.forEach((d, i) => {
      const student = findStudent(results[i]?.label);
      const label = student ? student.name : 'Unknown';
      const { x, y, width, height } = d.detection.box;
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4; ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#10b981'; ctx.fillRect(x, y - 30, ctx.measureText(label).width + 20, 30);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.fillText(label, x + 10, y - 10);
    });
  };

  const findStudent = (id) => registeredUsersRef.current.find(u => String(u.student_id) === String(id));

  const updateAttendance = async (results) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    // Find the current active period according to the clock
    const currentPeriod = periods.find(p => totalMinutes >= p.minutesStart && totalMinutes < p.minutesEnd);

    const recognized = results
      .filter(r => r && r.label !== 'unknown')
      .map(r => findStudent(r.label))
      .filter(Boolean);
    
    let hasUpdates = false;

    for (const student of recognized) {
      setDetectedStudent(student);
      
      if (!currentPeriod) {
        setSyncStatus('No Active Period');
        continue;
      }

      const column = currentPeriod.column_name;
      const key = `${student.student_id}-${date}-${column}`;
      
      if (Date.now() - (lastAttendanceWriteRef.current[key] || 0) < 10000) {
        setSyncStatus(`Checked: ${currentPeriod.period_name}`);
        continue;
      }
      
      // Optimistic UI
      setAttendance(prev => ({
        ...prev,
        [student.student_id]: { ...prev[student.student_id], [column]: 'Present' }
      }));

      setSyncStatus(`Saving ${currentPeriod.period_name}...`);
      
      try {
        const studentIdStr = String(student.student_id);
        const { data: existing } = await supabase
          .from('tbl_attendance')
          .select('student_id')
          .eq('student_id', studentIdStr)
          .eq('attendance_date', date)
          .single();

        const payload = { [column]: 'Present' };

        if (existing) {
          await supabase.from('tbl_attendance').update(payload).eq('student_id', studentIdStr).eq('attendance_date', date);
        } else {
          await supabase.from('tbl_attendance').insert({
            student_id: studentIdStr,
            attendance_date: date,
            ...payload
          });
        }

        lastAttendanceWriteRef.current[key] = Date.now();
        setSyncStatus('Success!');
        hasUpdates = true;
      } catch (err) {
        setSyncStatus(`Sync Failed`);
        console.error(err);
      }
    }

    if (hasUpdates) await fetchTodayAttendance();
  };

  const filteredStudents = registeredUsers.filter(s => {
    const records = attendance[s.student_id] || {};
    return Object.values(records).some(v => v === 'Present');
  });

  const activePeriod = periods.find(p => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= p.minutesStart && mins < p.minutesEnd;
  });

  return (
    <div className={Styles.pageWrapper}>
      <div className={Styles.statsBar}>
        <div className={Styles.statItem}>
          <Clock className="w-5 h-5 text-blue-400" />
          <span>Active: <strong>{activePeriod ? activePeriod.period_name : 'No Period'}</strong></span>
        </div>
        <div className={Styles.statItem}>
          <Database className="w-5 h-5 text-purple-400" />
          <span>Timing: <strong className="text-purple-400">Database Driven</strong></span>
          <button onClick={refreshSchedule} className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors">
            <RefreshCcw className="w-3 h-3 text-slate-400" />
          </button>
        </div>
        <div className={Styles.statItem}>
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>Today: <strong>{filteredStudents.length} Present</strong></span>
        </div>
      </div>

      <div className={Styles.mainContent}>
        <div className={Styles.cameraSection}>
          <div className={Styles.videoContainer}>
            <video ref={videoRef} autoPlay muted playsInline onLoadedMetadata={detectFaces} className={Styles.video} />
            <canvas ref={canvasRef} className={Styles.overlayCanvas} />
            {loading && <div className={Styles.loadingOverlay}><RefreshCcw className="animate-spin w-10 h-10 text-white" /></div>}
          </div>
          
          <AnimatePresence>
            {detectedStudent && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={Styles.liveDetection}>
                <div className={Styles.livePulse} />
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-full">
                    <User className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Live Record</h4>
                    <p className="text-white text-xl font-bold leading-tight">{detectedStudent.name}</p>
                    <p className="text-slate-400 text-sm mt-1">{activePeriod?.period_name || 'Outside Timing'}</p>
                  </div>
                </div>
                
                <div className="ml-auto flex flex-col items-end gap-2">
                    {syncStatus && (
                        <div className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm ${
                            syncStatus === 'Success!' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                            {syncStatus}
                        </div>
                    )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={Styles.tableSection}>
          <div className={Styles.tableHeader}>
            <h2 className="text-xl font-bold">Dynamic Attendance Sheet</h2>
            <div className={Styles.searchBox}>
              <Search className="w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Find..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className={Styles.tableContainer}>
            <table className={Styles.professionalTable}>
              <thead>
                <tr>
                  <th>Student Name</th>
                  {periods.map(p => <th key={p.period_name} className="text-center">{p.period_name}</th>)}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredStudents.map((student, idx) => {
                    const studentRecords = attendance[student.student_id] || {};
                    return (
                        <motion.tr key={student.student_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <td className="font-bold text-white">{student.name}</td>
                          {periods.map(p => (
                            <td key={p.period_name} className="text-center">
                              {studentRecords[p.column_name] === 'Present' ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                                  <span className="text-emerald-400 font-bold text-[9px]">PRESENT</span>
                                </div>
                              ) : (
                                <span className="text-slate-800 text-[10px]">-</span>
                              )}
                            </td>
                          ))}
                        </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceAttendanceIN;
