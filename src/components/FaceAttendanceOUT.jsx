import React, { useEffect, useRef, useState } from 'react';
import '@tensorflow/tfjs';
import * as faceapi from 'face-api.js';
import supabase from '../utils/supabase';
import Styles from './faceAttendance.module.css';

const detectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.35,
});

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

const FaceAttendanceOUT = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const faceMatcherRef = useRef(null);
  const registeredUsersRef = useRef([]);
  const detectionTimerRef = useRef(null);
  const streamRef = useRef(null);
  const isDetectingRef = useRef(false);
  const lastAttendanceWriteRef = useRef({});

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading face models...');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [detectedStudent, setDetectedStudent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    registeredUsersRef.current = registeredUsers;
  }, [registeredUsers]);

  useEffect(() => {
    let isMounted = true;
    const setup = async () => {
      try {
        setLoading(true);
        setStatus('Starting TensorFlow...');
        await initializeTensorflow();

        setStatus('Loading face models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);

        if (!isMounted) return;
        setStatus('Starting camera...');
        await startVideo();

        if (!isMounted) return;
        setLoading(false);
        setStatus('Loading students...');

        const users = await fetchStudents();
        setRegisteredUsers(users);

        if (!isMounted) return;
        setStatus('Preparing known faces...');
        faceMatcherRef.current = await buildFaceMatcher(users);

        if (!faceMatcherRef.current) {
          setError('No usable student face photos found.');
          setStatus('Camera ready');
          return;
        }

        setStatus('Looking for faces...');
      } catch (setupError) {
        console.error('Face attendance setup failed:', setupError);
        if (isMounted) {
          setError(setupError.message || 'Failed to initialize face attendance');
          setLoading(false);
        }
      }
    };
    setup();
    return () => {
      isMounted = false;
      window.clearTimeout(detectionTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('tbl_student')
      .select(`
        student_id,
        student_name,
        stud_photo,
        tbl_department(department_name),
        tbl_programme(programme_name)
      `);
    if (error) throw error;
    return (data || [])
      .filter((student) => student.stud_photo)
      .map((student) => ({
        student_id: student.student_id,
        name: student.student_name,
        image: student.stud_photo,
        department: student.tbl_department?.department_name || 'N/A',
        programme: student.tbl_programme?.programme_name || 'N/A',
      }));
  };

  const buildFaceMatcher = async (users) => {
    const descriptors = [];
    for (const user of users) {
      try {
        const img = await faceapi.fetchImage(user.image);
        const detection = await faceapi
          .detectSingleFace(img, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection) {
          descriptors.push(new faceapi.LabeledFaceDescriptors(String(user.student_id), [detection.descriptor]));
        }
      } catch (e) { console.error(e); }
    }
    return descriptors.length ? new faceapi.FaceMatcher(descriptors, 0.6) : null;
  };

  const startVideo = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  };

  const scheduleNextDetection = () => {
    detectionTimerRef.current = window.setTimeout(detectFaces, 250);
  };

  const detectFaces = async () => {
    if (isDetectingRef.current || !videoRef.current) {
      scheduleNextDetection();
      return;
    }
    const video = videoRef.current;
    if (video.readyState < 2) {
      scheduleNextDetection();
      return;
    }
    isDetectingRef.current = true;
    try {
      const detections = await faceapi
        .detectAllFaces(video, detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptors();
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      const resized = faceapi.resizeResults(detections, displaySize);
      const results = resized.map((d) => faceMatcherRef.current.findBestMatch(d.descriptor));
      drawDetections(resized, results, displaySize);
      await updateAttendance(results);
    } catch (e) { console.error(e); } finally {
      isDetectingRef.current = false;
      scheduleNextDetection();
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
      ctx.strokeStyle = '#00c853'; ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = '#00c853'; ctx.fillRect(x, y - 24, ctx.measureText(label).width + 10, 24);
      ctx.fillStyle = '#fff'; ctx.fillText(label, x + 5, y - 8);
    });
  };

  const findStudent = (id) => registeredUsersRef.current.find((u) => String(u.student_id) === String(id));

  const insertAttendanceOut = async (studentId, date, time) => {
    const key = `${studentId}-${date}`;
    if (Date.now() - (lastAttendanceWriteRef.current[key] || 0) < 10000) return;
    lastAttendanceWriteRef.current[key] = Date.now();

    const studentIdStr = String(studentId);

    // No longer using id or attendance_id column
    const { data: existing, error: readError } = await supabase
      .from('tbl_attendance')
      .select('student_id') // Check by student_id and date
      .eq('student_id', studentIdStr)
      .eq('attendance_date', date)
      .limit(1);

    if (readError) {
      console.error(readError);
      return;
    }

    if (existing && existing.length > 0) {
      await supabase
        .from('tbl_attendance')
        .update({ exit_time: time, status: 'Present' })
        .eq('student_id', studentIdStr)
        .eq('attendance_date', date);
    } else {
      await supabase.from('tbl_attendance').insert([
        {
          student_id: studentIdStr,
          attendance_date: date,
          exit_time: time,
          status: 'Present',
        },
      ]);
    }
  };

  const updateAttendance = async (results) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString([], { hour12: false });
    const recognized = results.map((r) => findStudent(r.label)).filter(Boolean);

    if (!recognized.length) return;

    for (const student of recognized) {
      setDetectedStudent(student);
      await insertAttendanceOut(student.student_id, date, time);
    }
  };

  return (
    <div className={Styles.pageWrapper}>
        <div className={Styles.cameraSection}>
          <video ref={videoRef} autoPlay muted playsInline className={Styles.video} />
          <canvas ref={canvasRef} className={Styles.overlayCanvas} />
          {error && <div className={Styles.errorToast}>{error}</div>}
        </div>
        <div className={Styles.tableSection}>
          <h2>Sign-Out Records</h2>
          {detectedStudent && (
            <div className="p-4 bg-emerald-500/10 rounded-lg mb-4 border border-emerald-500/20">
              <p className="text-emerald-400 font-bold">Detected: {detectedStudent.name}</p>
            </div>
          )}
          <table className={Styles.professionalTable}>
            <thead>
              <tr><th>Name</th><th>Programme</th><th>Time</th></tr>
            </thead>
            <tbody>
              {attendance.map((entry, i) => (
                <tr key={i}><td>{entry.name}</td><td>{entry.programme}</td><td>{entry.time}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default FaceAttendanceOUT;
