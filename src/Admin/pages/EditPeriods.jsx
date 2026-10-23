import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, RefreshCcw, AlertCircle, CheckCircle, Database } from 'lucide-react';
import supabase from '../../utils/supabase';
import style from './editPeriods.module.css';

const EditPeriods = () => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_period')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching periods:', error);
      if (error.code === 'PGRST116' || error.code === '42P01') {
        setMessage({ type: 'error', text: 'Database table "tbl_period" not found. Please create it in Supabase.' });
      }
    } else {
      setPeriods(data || []);
    }
    setLoading(false);
  };

  const handleFieldChange = (id, field, value) => {
    setPeriods(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      console.log('Attempting to save dynamic periods:', periods);
      
      const updatePromises = periods.map(period => {
        const { id, ...data } = period;
        return supabase
          .from('tbl_period')
          .update(data)
          .eq('id', id);
      });

      const results = await Promise.all(updatePromises);
      const firstError = results.find(r => r.error)?.error;

      if (firstError) throw firstError;

      setMessage({ type: 'success', text: 'Schedule updated successfully!' });
    } catch (err) {
      console.error('Detailed Save Error:', err);
      setMessage({ 
        type: 'error', 
        text: `Error: ${err.message || 'Failed to save changes.'}` 
      });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className={style.loadingContainer}>
      <RefreshCcw className="animate-spin w-10 h-10 text-emerald-400" />
      <p>Loading dynamic schedule...</p>
    </div>
  );

  return (
    <div className={style.container}>
      <div className={style.header}>
        <div className={style.titleArea}>
          <Clock className="w-8 h-8 text-emerald-400" />
          <div>
            <h1>Attendance Schedule</h1>
            <p>Map periods to database columns and define time windows.</p>
          </div>
        </div>
        <button 
          className={style.saveButton} 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`${style.message} ${style[message.type]}`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </motion.div>
      )}

      <div className={style.grid}>
        {periods.map((period) => (
          <motion.div 
            key={period.id} 
            className={style.periodCard}
            whileHover={{ scale: 1.01 }}
          >
            <div className={style.periodHeader}>
              <span className={style.periodId}>#{period.id}</span>
              <div className={style.headerMain}>
                  <h3 className={style.periodTitle}>{period.period_name}</h3>
              </div>
            </div>
            
            <div className={style.inputs}>
              <div className={style.inputGroup}>
                <label>Start Time</label>
                <input 
                  type="time" 
                  value={period.start_time} 
                  onChange={(e) => handleFieldChange(period.id, 'start_time', e.target.value)}
                />
              </div>
              <div className={style.inputGroup}>
                <label>End Time</label>
                <input 
                  type="time" 
                  value={period.end_time} 
                  onChange={(e) => handleFieldChange(period.id, 'end_time', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        ))}
        {periods.length === 0 && !loading && (
            <div className={style.empty}>
                <p>No periods found. Seed your database with the new dynamic schema.</p>
                <button onClick={async () => {
                    const seed = [
                        { period_name: 'Period 1', column_name: 'first_period', start_time: '10:00', end_time: '11:00' },
                        { period_name: 'Period 2', column_name: 'second_period', start_time: '11:15', end_time: '12:00' },
                        { period_name: 'Period 3', column_name: 'third_period', start_time: '12:00', end_time: '13:00' },
                        { period_name: 'Period 4', column_name: 'fourth_period', start_time: '13:40', end_time: '14:10' },
                        { period_name: 'Period 5', column_name: 'fifth_period', start_time: '14:20', end_time: '15:00' },
                    ];
                    setSaving(true);
                    const { error } = await supabase.from('tbl_period').insert(seed);
                    if (!error) fetchPeriods();
                    setSaving(false);
                }} className={style.seedButton}>Initialize Dynamic Periods</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default EditPeriods;
