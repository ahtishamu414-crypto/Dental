import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import drSarah from '../assets/images/dr-sarah-jenkins.jpg';
import drMichael from '../assets/images/dr-michael-chen.jpg';
import drEmily from '../assets/images/dr-emily-rodriguez.jpg';
import { 
  X, CheckCircle2, CalendarCheck, Clock, ShieldAlert, Check,
  ChevronRight, ArrowLeft, AlertCircle, Download, Copy, Calendar, RefreshCw
} from 'lucide-react';

const SERVICES_CONFIG = [
  { name: 'General Checkup', duration: 30, price: 150, category: 'general', desc: 'Complete examination, low-radiation X-rays' },
  { name: 'Professional Cleaning', duration: 45, price: 200, category: 'general', desc: 'Plaque removal & enamel polishing' },
  { name: 'Teeth Whitening', duration: 60, price: 450, category: 'cosmetic', desc: 'Laser in-office whitening' },
  { name: 'Dental Fillings', duration: 60, price: 250, category: 'general', desc: 'Composite tooth-colored resin' },
  { name: 'Root Canal Therapy', duration: 90, price: 1200, category: 'surgery', desc: 'Pulp infection relief & tooth preservation' },
  { name: 'Tooth Extraction', duration: 60, price: 300, category: 'surgery', desc: 'Gentle surgical & standard extraction' },
  { name: 'Orthodontic Consultation', duration: 45, price: 180, category: 'ortho', desc: 'Braces & clear aligner alignment plan' },
];

const DOCTOR_PROFILES = [
  { 
    id: 'Any Available Doctor', 
    name: 'Any Available Doctor', 
    title: 'Earliest Available Opening',
    initials: '⚡',
    badge: 'Fastest Chair',
    category: 'all',
    credentials: 'Board-Certified Clinic Team',
    specialty: 'Matches you with the earliest open chair across all dentists',
    availability: 'Openings Available Today',
    color: '#1597a5',
    featured: false,
    image: null
  },
  { 
    id: 'Dr. Sarah Jenkins (General & Preventative)', 
    name: 'Dr. Sarah Jenkins, DDS', 
    title: 'General & Preventative Lead',
    initials: 'SJ',
    badge: '⭐ Most Popular',
    category: 'general',
    credentials: 'Columbia Dental • 14+ Yrs Exp',
    specialty: 'Comprehensive checkups, preventative cleanings, and aesthetic fillings',
    availability: 'Mon, Tue, Thu (Openings this week)',
    color: '#0d9488',
    featured: true,
    image: drSarah
  },
  { 
    id: 'Dr. Michael Chen (Orthodontics & Cosmetic)', 
    name: 'Dr. Michael Chen, DMD', 
    title: 'Orthodontics & Cosmetic Specialist',
    initials: 'MC',
    badge: '5.0 ★ Rated',
    category: 'ortho',
    credentials: 'NYU Dental • Invisalign Master',
    specialty: 'Clear aligners, aesthetic smile makeovers, and porcelain veneers',
    availability: 'Tue, Wed, Sat (Openings this week)',
    color: '#2563eb',
    featured: true,
    image: drMichael
  },
  { 
    id: 'Dr. Emily Rodriguez (Oral Surgery & Endodontics)', 
    name: 'Dr. Emily Rodriguez, DDS', 
    title: 'Oral Surgery & Endodontics Lead',
    initials: 'ER',
    badge: 'Surgical Specialist',
    category: 'surgery',
    credentials: 'Harvard Dental • 10+ Yrs Exp',
    specialty: 'Painless microscopic root canals and complex surgical extractions',
    availability: 'Wed, Thu, Fri (Immediate openings)',
    color: '#7c3aed',
    featured: false,
    image: drEmily
  }
];

const DEFAULT_SLOTS = [
  '9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM',
  '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM', '4:00 PM', '4:45 PM'
];

export default function AppointmentModal({ isOpen, onClose, initialService, initialDoctor }) {
  const { user } = useAuth();

  // Multi-step wizard: 1 = Service & Doctor, 2 = Date & Slot, 3 = Patient Details & Review
  const [step, setStep] = useState(1);
  const [docFilter, setDocFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'morning', 'afternoon'
  
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    service_type: 'General Checkup',
    doctor_name: 'Any Available Doctor',
    preferred_date: '',
    preferred_time: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Real-time slot availability
  const [availableSlots, setAvailableSlots] = useState(DEFAULT_SLOTS);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);

  // Generate a random stable Reference ID upon booking completion
  const [bookingRef, setBookingRef] = useState('');

  // Date boundaries
  const todayObj = new Date();
  const today = todayObj.toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(todayObj.getDate() + 90);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  // Auto-fill logged in user info & initialize defaults
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        patient_name: user?.full_name || prev.patient_name,
        patient_email: user?.email || prev.patient_email,
        patient_phone: user?.phone || prev.patient_phone,
        service_type: initialService || prev.service_type || 'General Checkup',
        doctor_name: initialDoctor || prev.doctor_name || 'Any Available Doctor',
        preferred_date: prev.preferred_date || today,
      }));
      setStep(1);
      setError('');
      setSuccess(false);
      setCopied(false);
      setBookingRef('BSD-' + Math.floor(10000 + Math.random() * 90000));
    }
  }, [isOpen, initialService, initialDoctor, user, today]);

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setStep(1);
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Update duration when service changes
  useEffect(() => {
    const s = SERVICES_CONFIG.find((item) => item.name === formData.service_type);
    if (s) {
      setSlotDuration(s.duration);
    }
  }, [formData.service_type]);

  // When date, doctor, or service changes, fetch live available slots from backend
  useEffect(() => {
    if (!isOpen || !formData.preferred_date) {
      setBookedSlots([]);
      setAvailableSlots(DEFAULT_SLOTS);
      return;
    }

    if (formData.preferred_date < today || formData.preferred_date > maxDate) {
      setError('Please select a valid date between today and 90 days ahead.');
      setAvailableSlots([]);
      return;
    }

    setError('');
    setSlotsLoading(true);

    appointmentsAPI
      .getAvailableSlots(formData.preferred_date, formData.doctor_name, formData.service_type)
      .then((res) => {
        const booked = res.data?.booked_slots || [];
        const available = res.data?.available_slots || [];
        setBookedSlots(booked);
        setAvailableSlots(available);
        if (res.data?.duration_minutes) {
          setSlotDuration(res.data.duration_minutes);
        }

        // If previously selected time is now booked, unselect it
        if (booked.includes(formData.preferred_time)) {
          setFormData((prev) => ({ ...prev, preferred_time: '' }));
        }
      })
      .catch((err) => {
        console.warn('Could not query slots from backend:', err);
        setAvailableSlots(DEFAULT_SLOTS);
      })
      .finally(() => {
        setSlotsLoading(false);
      });
  }, [isOpen, formData.preferred_date, formData.doctor_name, formData.service_type, today, maxDate]);

  if (!isOpen) return null;

  const update = (field) => (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSelectTime = (time) => {
    if (bookedSlots.includes(time)) return;
    setFormData((prev) => ({ ...prev, preferred_time: time }));
  };

  const handleQuickDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dateStr = d.toISOString().split('T')[0];
    setFormData((prev) => ({ ...prev, preferred_date: dateStr, preferred_time: '' }));
  };

  const canGoToStep2 = !!formData.service_type && !!formData.doctor_name;
  const canGoToStep3 = !!formData.preferred_date && !!formData.preferred_time;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.patient_name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.patient_email.trim() || !formData.patient_email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.patient_phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!formData.preferred_date) {
      setError('Please pick an appointment date.');
      return;
    }
    if (!formData.preferred_time) {
      setError('Please select an available time slot.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        duration_minutes: slotDuration,
      };

      const res = await appointmentsAPI.create(payload);
      if (res.data?.success) {
        setSuccess(true);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response?.data?.detail || 'That time slot was just reserved by another patient. Please choose another time.');
        setBookedSlots((prev) => [...new Set([...prev, formData.preferred_time])]);
        setFormData((prev) => ({ ...prev, preferred_time: '' }));
        setStep(2); // take them back to choose a slot
      } else {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Could not submit your request. Check the details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentServiceObj = SERVICES_CONFIG.find((s) => s.name === formData.service_type) || SERVICES_CONFIG[0];
  const currentDoctorObj = DOCTOR_PROFILES.find((d) => d.id === formData.doctor_name) || DOCTOR_PROFILES[0];
  const allBooked = formData.preferred_date && availableSlots.length === 0;

  // Filtered doctors
  const filteredDoctors = DOCTOR_PROFILES.filter((d) => {
    if (docFilter === 'all') return true;
    return d.category === docFilter || d.id === 'Any Available Doctor';
  });

  // Filtered time slots by morning/afternoon
  const displayedSlots = DEFAULT_SLOTS.filter((t) => {
    const isMorning = t.includes('AM');
    if (timeFilter === 'morning') return isMorning;
    if (timeFilter === 'afternoon') return !isMorning;
    return true;
  });

  // Copy shareable summary to clipboard
  const handleCopySummary = () => {
    const text = `Bright Smile Dental Appointment\nRef: ${bookingRef}\nPatient: ${formData.patient_name}\nTreatment: ${formData.service_type}\nDoctor: ${currentDoctorObj.name}\nDate: ${formData.preferred_date} at ${formData.preferred_time}\nAddress: 123 Demo Avenue, Midtown Manhattan, NY 10001`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Google Calendar Link generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Dental Appointment: ${formData.service_type} - Bright Smile Dental`);
    const details = encodeURIComponent(`Appointment with ${currentDoctorObj.name} for ${formData.service_type}.\nReference: ${bookingRef}\nClinic Phone: (212) 555-0199`);
    const location = encodeURIComponent('Bright Smile Dental, 123 Demo Avenue, Midtown Manhattan, NY 10001');
    
    // Format date string for Google Cal
    const cleanDate = formData.preferred_date.replace(/-/g, '');
    const startTimeStr = cleanDate + 'T140000Z'; // fallback UTC slot
    const endTimeStr = cleanDate + 'T150000Z';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeStr}/${endTimeStr}&details=${details}&location=${location}`;
  };

  // Apple/Outlook .ics file download
  const handleDownloadICS = () => {
    const cleanDate = formData.preferred_date.replace(/-/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bright Smile Dental//Booking System//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Dental Visit: ${formData.service_type} (${currentDoctorObj.name})`,
      `DESCRIPTION:Appointment Reference: ${bookingRef}\\nPatient: ${formData.patient_name}\\nClinic Phone: (212) 555-0199`,
      'LOCATION:Bright Smile Dental, 123 Demo Avenue, Midtown Manhattan, NY 10001',
      `DTSTART:${cleanDate}T140000Z`,
      `DTEND:${cleanDate}T150000Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `BrightSmile_Appointment_${bookingRef}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <style>{css}</style>

      <div className="bsa-overlay" onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="bsa-card" role="dialog" aria-modal="true" aria-labelledby="bsa-title">
          
          {/* Confetti Particle Burst on Success */}
          {success && (
            <div className="bsa-confetti-container" aria-hidden="true">
              {[...Array(24)].map((_, i) => (
                <span key={i} className={`bsa-confetti-piece p-${(i % 6) + 1}`} />
              ))}
            </div>
          )}

          <button type="button" className="bsa-close" onClick={handleClose} aria-label="Close booking modal">
            <X size={18} />
          </button>

          {success ? (
            /* =========================================================================
               WOW SUCCESS CONFIRMATION STATE
               ========================================================================= */
            <div className="bsa-success" role="status">
              <span className="bsa-success-icon">
                <CheckCircle2 size={42} />
              </span>
              
              <div className="bsa-ref-pill">
                Reference ID: <strong>{bookingRef}</strong>
              </div>

              <h3 id="bsa-title" className="bsa-title" style={{ fontSize: '1.5rem', marginBottom: 6 }}>
                Appointment Confirmed!
              </h3>
              <p className="bsa-sub" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: 18 }}>
                Your appointment with <strong>{currentDoctorObj.name}</strong> on <strong>{formData.preferred_date} at {formData.preferred_time}</strong> has been secured in our clinic schedule.
              </p>

              {/* Shareable Booking Summary Card */}
              <div className="bsa-summary-box">
                <div className="bsa-summary-row">
                  <span>Patient</span>
                  <strong>{formData.patient_name}</strong>
                </div>
                <div className="bsa-summary-row">
                  <span>Treatment Service</span>
                  <strong>{formData.service_type} ({slotDuration} mins)</strong>
                </div>
                <div className="bsa-summary-row">
                  <span>Dentist / Specialist</span>
                  <strong>{currentDoctorObj.name}</strong>
                </div>
                <div className="bsa-summary-row">
                  <span>Date & Dedicated Slot</span>
                  <strong style={{ color: 'var(--teal)' }}>
                    📅 {formData.preferred_date} • {formData.preferred_time}
                  </strong>
                </div>
                <div className="bsa-summary-row" style={{ borderBottom: 'none' }}>
                  <span>Confirmation Dispatched</span>
                  <strong style={{ color: '#0b6b57' }}>
                    ✓ Email & SMS confirmation to {formData.patient_email}
                  </strong>
                </div>
              </div>

              {/* Action Buttons: Add to Calendar & Copy Summary */}
              <div className="bsa-calendar-actions">
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bsa-cal-btn"
                  title="Add to Google Calendar"
                >
                  <Calendar size={14} color="#ea4335" /> Add to Google Calendar
                </a>
                <button
                  type="button"
                  className="bsa-cal-btn"
                  onClick={handleDownloadICS}
                  title="Download .ics for Apple / Outlook"
                >
                  <Download size={14} color="#0b2a4a" /> Apple / Outlook iCal
                </button>
                <button
                  type="button"
                  className="bsa-cal-btn"
                  onClick={handleCopySummary}
                  title="Copy confirmation details"
                >
                  <Copy size={14} /> {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
                </button>
              </div>

              {/* Reschedule or Return */}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="bsa-btn bsa-btn-ghost"
                  style={{ flex: 1, fontSize: '13px' }}
                  onClick={() => { setSuccess(false); setStep(2); }}
                >
                  <RefreshCw size={13} style={{ marginRight: 4 }} /> Modify Time Slot
                </button>
                <button
                  type="button"
                  className="bsa-btn bsa-btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleClose}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bsa-header">
                <span className="bsa-icon">
                  <CalendarCheck size={22} />
                </span>
                <div>
                  <h3 id="bsa-title" className="bsa-title">Book an Appointment</h3>
                  <p className="bsa-sub">Real-time scheduling with board-certified dentists</p>
                </div>
              </div>

              {/* Interactive Stepper with percentage progress bar */}
              <div className="bsa-stepper-wrap">
                <div className="bsa-stepper-progress-track">
                  <div 
                    className="bsa-stepper-progress-fill" 
                    style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} 
                  />
                </div>
                <div className="bsa-stepper">
                  <div className={`bsa-step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'complete' : ''}`} onClick={() => setStep(1)}>
                    <span className="bsa-step-num">{step > 1 ? <Check size={12} /> : '1'}</span>
                    <span className="bsa-step-text">Service & Doctor</span>
                  </div>
                  <div className="bsa-step-line" />
                  <div className={`bsa-step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'complete' : ''}`} onClick={() => canGoToStep2 && setStep(2)}>
                    <span className="bsa-step-num">{step > 2 ? <Check size={12} /> : '2'}</span>
                    <span className="bsa-step-text">Date & Slot</span>
                  </div>
                  <div className="bsa-step-line" />
                  <div className={`bsa-step-item ${step >= 3 ? 'active' : ''}`}>
                    <span className="bsa-step-num">3</span>
                    <span className="bsa-step-text">Confirm Visit</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bsa-error" role="alert">
                  <ShieldAlert size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {error}
                </div>
              )}

              {/* =========================================================================
                 STEP 1: SERVICE & DOCTOR SELECTION WITH FILTER CHIPS
                 ========================================================================= */}
              {step === 1 && (
                <div className="bsa-step-content">
                  {/* Service Selection */}
                  <div className="bsa-group">
                    <label className="bsa-label" htmlFor="bsa-service">
                      Select Treatment / Service
                    </label>
                    <select
                      id="bsa-service"
                      className="bsa-input"
                      value={formData.service_type}
                      onChange={update('service_type')}
                    >
                      {SERVICES_CONFIG.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} — {s.duration} mins • ${s.price}
                        </option>
                      ))}
                    </select>
                    <div className="bsa-sub" style={{ marginTop: 4 }}>
                      💡 {currentServiceObj.desc}
                    </div>
                  </div>

                  {/* Doctor Filter Tabs */}
                  <div className="bsa-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="bsa-label" style={{ marginBottom: 0 }}>
                        Select Doctor or Specialist
                      </label>
                      <div className="bsa-filter-tabs">
                        {[
                          { id: 'all', label: 'All Doctors' },
                          { id: 'general', label: 'General' },
                          { id: 'ortho', label: 'Orthodontics' },
                          { id: 'surgery', label: 'Surgery' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={`bsa-filter-pill ${docFilter === t.id ? 'active' : ''}`}
                            onClick={() => setDocFilter(t.id)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Doctor Cards */}
                    <div className="bsa-doctor-grid">
                      {filteredDoctors.map((doc, idx) => {
                        const isSelected = formData.doctor_name === doc.id;
                        return (
                          <div
                            key={doc.id}
                            className={`bsa-doctor-card ${isSelected ? 'selected' : ''} ${doc.featured ? 'featured' : ''} bsa-stagger-${idx + 1}`}
                            onClick={() => setFormData((prev) => ({ ...prev, doctor_name: doc.id }))}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setFormData((prev) => ({ ...prev, doctor_name: doc.id }))}
                          >
                            <div className="bsa-doctor-top">
                              <div className="bsa-doctor-avatar" style={{ background: isSelected ? 'var(--teal)' : '#e8f6f8', color: isSelected ? '#fff' : doc.color, overflow: 'hidden' }}>
                                {doc.image ? (
                                  <img src={doc.image} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                                ) : (
                                  doc.initials
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="bsa-doctor-name">{doc.name}</div>
                                <div className="bsa-doctor-title">{doc.title}</div>
                              </div>
                              <span className="bsa-doctor-badge">{doc.badge}</span>
                            </div>
                            
                            <div className="bsa-doctor-cred">
                              🎓 {doc.credentials}
                            </div>
                            
                            <div className="bsa-doctor-desc">{doc.specialty}</div>
                            
                            <div className="bsa-doctor-footer">
                              <span className="bsa-doctor-avail">
                                <span className="bsa-live-dot" /> {doc.availability}
                              </span>
                              {isSelected ? (
                                <span className="bsa-doctor-check"><Check size={13} /> Selected</span>
                              ) : (
                                <span className="bsa-doctor-select-cta">Choose Clinician →</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bsa-actions">
                    <button type="button" className="bsa-btn bsa-btn-ghost" onClick={handleClose}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="bsa-btn bsa-btn-primary"
                      disabled={!canGoToStep2}
                      onClick={() => setStep(2)}
                    >
                      Continue to Schedule <ChevronRight size={15} style={{ marginLeft: 4 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                 STEP 2: DATE & REAL-TIME SLOTS WITH MORNING/AFTERNOON FILTER
                 ========================================================================= */}
              {step === 2 && (
                <div className="bsa-step-content">
                  {/* Summary ribbon */}
                  <div className="bsa-mini-ribbon">
                    <div>
                      <strong>{formData.service_type}</strong> ({slotDuration}m dedicated)
                    </div>
                    <div className="bsa-ribbon-doc">
                      👨‍⚕️ {currentDoctorObj.name}
                    </div>
                  </div>

                  {/* Date Picker & Quick Chips */}
                  <div className="bsa-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="bsa-label" htmlFor="bsa-date">Select Appointment Date</label>
                      <span className="bsa-hint">Today to 90 days out</span>
                    </div>

                    <div className="bsa-quick-chips">
                      <button type="button" className="bsa-quick-chip" onClick={() => handleQuickDate(0)}>
                        Today
                      </button>
                      <button type="button" className="bsa-quick-chip" onClick={() => handleQuickDate(1)}>
                        Tomorrow
                      </button>
                      <button type="button" className="bsa-quick-chip" onClick={() => handleQuickDate(2)}>
                        In 2 Days
                      </button>
                      <button type="button" className="bsa-quick-chip" onClick={() => handleQuickDate(7)}>
                        Next Week
                      </button>
                    </div>

                    <input
                      id="bsa-date"
                      type="date"
                      required
                      min={today}
                      max={maxDate}
                      className="bsa-input"
                      value={formData.preferred_date}
                      onChange={update('preferred_date')}
                    />
                  </div>

                  {/* Real-time Time Slots Grid with Day-part Tabs */}
                  <div className="bsa-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label className="bsa-label" style={{ marginBottom: 0 }}>
                          Available Time Slots
                        </label>
                        <span className="bsa-duration-tag">
                          <Clock size={12} /> {slotDuration}m
                        </span>
                      </div>

                      {/* Day part filter */}
                      <div className="bsa-time-tabs">
                        <button
                          type="button"
                          className={`bsa-time-pill ${timeFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setTimeFilter('all')}
                        >
                          All ({DEFAULT_SLOTS.length})
                        </button>
                        <button
                          type="button"
                          className={`bsa-time-pill ${timeFilter === 'morning' ? 'active' : ''}`}
                          onClick={() => setTimeFilter('morning')}
                        >
                          🌅 Morning
                        </button>
                        <button
                          type="button"
                          className={`bsa-time-pill ${timeFilter === 'afternoon' ? 'active' : ''}`}
                          onClick={() => setTimeFilter('afternoon')}
                        >
                          ☀️ Afternoon
                        </button>
                      </div>
                    </div>

                    {!formData.preferred_date ? (
                      <div className="bsa-slots-placeholder">
                        Pick a date above to check available slots
                      </div>
                    ) : slotsLoading ? (
                      <div className="bsa-slots-skeleton">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <div key={n} className="bsa-skeleton-slot" />
                        ))}
                      </div>
                    ) : allBooked ? (
                      <div className="bsa-slots-alert">
                        <AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                        All slots for this doctor are booked on this date. Please select another date or choose "Any Available Doctor".
                      </div>
                    ) : (
                      <div className="bsa-slots-grid">
                        {displayedSlots.map((t) => {
                          const isBooked = bookedSlots.includes(t);
                          const isSelected = formData.preferred_time === t;
                          const isPopular = t === '10:30 AM' || t === '2:30 PM';
                          return (
                            <button
                              key={t}
                              type="button"
                              disabled={isBooked}
                              onClick={() => handleSelectTime(t)}
                              className={`bsa-slot-pill ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                              title={isBooked ? 'Already reserved by another patient' : `Select ${t}`}
                            >
                              {isSelected && <Check size={12} style={{ marginRight: 4 }} />}
                              {t}
                              {isPopular && !isBooked && !isSelected && (
                                <span className="bsa-popular-tag">Popular</span>
                              )}
                              {isBooked && <span className="bsa-booked-tag">Reserved</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bsa-actions">
                    <button type="button" className="bsa-btn bsa-btn-ghost" onClick={() => setStep(1)}>
                      <ArrowLeft size={15} style={{ marginRight: 4 }} /> Back to Doctors
                    </button>
                    <button
                      type="button"
                      className="bsa-btn bsa-btn-primary"
                      disabled={!canGoToStep3}
                      onClick={() => setStep(3)}
                    >
                      Patient Details <ChevronRight size={15} style={{ marginLeft: 4 }} />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                 STEP 3: PATIENT DETAILS & CONFIRMATION
                 ========================================================================= */}
              {step === 3 && (
                <form onSubmit={handleSubmit} className="bsa-step-content">
                  {/* Appointment Review Summary Banner */}
                  <div className="bsa-summary-box" style={{ marginBottom: 16 }}>
                    <div className="bsa-summary-row">
                      <span>Treatment</span>
                      <strong>{formData.service_type} (${currentServiceObj.price})</strong>
                    </div>
                    <div className="bsa-summary-row">
                      <span>Dentist</span>
                      <strong>{currentDoctorObj.name}</strong>
                    </div>
                    <div className="bsa-summary-row" style={{ borderBottom: 'none' }}>
                      <span>Schedule</span>
                      <strong style={{ color: 'var(--teal)' }}>
                        📅 {formData.preferred_date} at {formData.preferred_time}
                      </strong>
                    </div>
                  </div>

                  {/* Patient Name */}
                  <div className="bsa-group">
                    <label className="bsa-label" htmlFor="bsa-name">Full name *</label>
                    <input
                      id="bsa-name"
                      type="text"
                      required
                      className="bsa-input"
                      value={formData.patient_name}
                      onChange={update('patient_name')}
                      placeholder="e.g. Sarah Jenkins"
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="bsa-row">
                    <div className="bsa-group">
                      <label className="bsa-label" htmlFor="bsa-email">Email address *</label>
                      <input
                        id="bsa-email"
                        type="email"
                        required
                        className="bsa-input"
                        value={formData.patient_email}
                        onChange={update('patient_email')}
                        placeholder="sarah@example.com"
                      />
                    </div>
                    <div className="bsa-group">
                      <label className="bsa-label" htmlFor="bsa-phone">Phone number *</label>
                      <input
                        id="bsa-phone"
                        type="tel"
                        required
                        className="bsa-input"
                        value={formData.patient_phone}
                        onChange={update('patient_phone')}
                        placeholder="(212) 555-0199"
                      />
                    </div>
                  </div>

                  {/* Patient Notes */}
                  <div className="bsa-group">
                    <label className="bsa-label" htmlFor="bsa-notes">Notes / Symptoms (optional)</label>
                    <input
                      id="bsa-notes"
                      type="text"
                      className="bsa-input"
                      value={formData.notes}
                      onChange={update('notes')}
                      placeholder="e.g. Sensitive tooth, general checkup, or insurance query"
                    />
                  </div>

                  <div className="bsa-actions">
                    <button type="button" className="bsa-btn bsa-btn-ghost" onClick={() => setStep(2)}>
                      <ArrowLeft size={15} style={{ marginRight: 4 }} /> Back to Schedule
                    </button>
                    <button
                      type="submit"
                      className="bsa-btn bsa-btn-primary"
                      disabled={loading || !formData.patient_name || !formData.patient_email}
                    >
                      {loading ? 'Securing slot…' : 'Confirm & Reserve Appointment'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const css = `
.bsa-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  background: rgba(11, 42, 74, 0.68);
  backdrop-filter: blur(6px);
  animation: bsaFadeIn 0.2s ease;
}
.bsa-card {
  position: relative;
  width: 100%; max-width: 580px; max-height: 94vh; overflow-y: auto;
  padding: 28px;
  background: #ffffff;
  border-radius: 20px;
  border-top: 5px solid #1597a5;
  box-shadow: 0 24px 60px rgba(11, 42, 74, 0.28);
  font-family: inherit;
  animation: bsaScaleUp 0.22s ease-out;
}
.bsa-close {
  position: absolute; top: 16px; right: 16px;
  display: grid; place-items: center;
  width: 32px; height: 32px;
  background: #f1f7f9; border: none; border-radius: 50%;
  color: #5b6f86; cursor: pointer;
  transition: all 0.15s ease;
}
.bsa-close:hover { background: #e0eff2; color: #0b2a4a; transform: scale(1.05); }

/* Header */
.bsa-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.bsa-icon {
  display: grid; place-items: center;
  width: 44px; height: 44px;
  background: #e8f6f8; color: #1597a5;
  border-radius: 12px; flex-shrink: 0;
}
.bsa-title { font-size: 1.3rem; font-weight: 800; color: #0b2a4a; margin: 0; }
.bsa-sub { font-size: 13px; color: #5b6f86; margin-top: 2px; }
.bsa-hint { font-size: 11.5px; color: #1597a5; font-weight: 600; }

/* Stepper Progress Bar */
.bsa-stepper-wrap {
  position: relative; margin-bottom: 20px;
  background: #f8fcfe; border: 1px solid #dceef2; border-radius: 14px;
  overflow: hidden; padding: 12px 14px 10px;
}
.bsa-stepper-progress-track {
  position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #e2eff2;
}
.bsa-stepper-progress-fill {
  height: 100%; background: linear-gradient(90deg, #1597a5 0%, #22c55e 100%);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.bsa-stepper {
  display: flex; align-items: center; justify-content: space-between;
}
.bsa-step-item {
  display: flex; align-items: center; gap: 8px;
  color: #8da1b5; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: color 0.15s ease;
}
.bsa-step-item.active { color: #0b2a4a; font-weight: 700; }
.bsa-step-item.complete { color: #1597a5; }
.bsa-step-num {
  display: grid; place-items: center; width: 22px; height: 22px;
  border-radius: 50%; background: #e2e8f0; color: #64748b; font-size: 11px;
}
.bsa-step-item.active .bsa-step-num { background: #1597a5; color: #fff; }
.bsa-step-item.complete .bsa-step-num { background: #d6efe8; color: #0b6b57; }
.bsa-step-line {
  flex: 1; height: 2px; background: #e2eff2; margin: 0 10px;
}

/* Doctor filter tabs */
.bsa-filter-tabs { display: flex; gap: 4px; }
.bsa-filter-pill {
  padding: 3px 8px; border-radius: 6px; border: none;
  background: transparent; color: #64748b; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.15s ease;
}
.bsa-filter-pill.active { background: #1597a5; color: #fff; }

/* Doctor selection cards */
.bsa-doctor-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
}
@media (max-width: 520px) {
  .bsa-doctor-grid { grid-template-columns: 1fr; }
}
.bsa-doctor-card {
  position: relative;
  padding: 12px; border: 1.5px solid #dceef2; border-radius: 12px;
  background: #ffffff; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column; gap: 6px;
}
.bsa-doctor-card:hover {
  border-color: #1597a5; background: #f8fcfe; transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(21, 151, 165, 0.12);
}
.bsa-doctor-card.selected {
  border-color: #1597a5; background: #f0fafb;
  box-shadow: 0 6px 18px rgba(21, 151, 165, 0.18);
}
.bsa-doctor-card.featured {
  border-color: #bfe3e8;
}
.bsa-doctor-top { display: flex; align-items: center; gap: 8px; }
.bsa-doctor-avatar {
  display: grid; place-items: center; width: 34px; height: 34px;
  border-radius: 8px; font-size: 12px; font-weight: 800; flex-shrink: 0;
}
.bsa-doctor-name { font-size: 13px; font-weight: 700; color: #0b2a4a; line-height: 1.2; }
.bsa-doctor-title { font-size: 11px; color: #5b6f86; }
.bsa-doctor-badge {
  font-size: 10px; font-weight: 700; background: #e8f6f8; color: #1597a5;
  padding: 2px 6px; border-radius: 4px; white-space: nowrap; align-self: flex-start;
}
.bsa-doctor-cred { font-size: 10.5px; font-weight: 600; color: #0b6b57; }
.bsa-doctor-desc { font-size: 11.5px; color: #64748b; line-height: 1.35; }
.bsa-doctor-footer {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; margin-top: auto; padding-top: 6px; border-top: 1px dashed #e2eff2;
}
.bsa-doctor-avail {
  color: #0b6b57; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;
}
.bsa-live-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25);
  animation: bsaPulseDot 2s infinite;
}
.bsa-doctor-check { color: #1597a5; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
.bsa-doctor-select-cta { color: #1597a5; font-size: 11px; font-weight: 600; }

/* Staggered entrance animation */
.bsa-stagger-1 { animation: bsaFadeSlide 0.25s ease both; }
.bsa-stagger-2 { animation: bsaFadeSlide 0.25s ease 0.05s both; }
.bsa-stagger-3 { animation: bsaFadeSlide 0.25s ease 0.1s both; }
.bsa-stagger-4 { animation: bsaFadeSlide 0.25s ease 0.15s both; }

/* Quick date chips */
.bsa-quick-chips {
  display: flex; gap: 6px; margin-bottom: 8px; overflow-x: auto; padding-bottom: 4px;
}
.bsa-quick-chip {
  padding: 4px 10px; border-radius: 999px; border: 1px solid #dceef2;
  background: #f8fcfe; color: #0b2a4a; font-size: 11.5px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.15s ease;
}
.bsa-quick-chip:hover {
  background: #1597a5; color: #fff; border-color: #1597a5;
}

/* Time day-part tabs */
.bsa-time-tabs { display: flex; gap: 4px; }
.bsa-time-pill {
  padding: 3px 8px; border-radius: 6px; border: none;
  background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.15s ease;
}
.bsa-time-pill.active { background: #1597a5; color: #fff; }

/* Mini ribbon */
.bsa-mini-ribbon {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; background: #e8f6f8; border-radius: 10px;
  font-size: 13px; color: #0b2a4a; margin-bottom: 16px;
}
.bsa-ribbon-doc { color: #1597a5; font-weight: 600; font-size: 12px; }

/* Error & Alerts */
.bsa-error {
  margin-bottom: 16px; padding: 10px 14px;
  background: #fdf2f2; border: 1px solid #fecaca;
  border-radius: 8px; color: #b91c1c; font-size: 13px; font-weight: 500;
}
.bsa-group { margin-bottom: 14px; }
.bsa-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 500px) { .bsa-row { grid-template-columns: 1fr; } }
.bsa-label { display: block; margin-bottom: 5px; font-size: 13px; font-weight: 600; color: #0b2a4a; }
.bsa-input {
  width: 100%; padding: 10px 12px;
  border: 1px solid #cfe3e8; border-radius: 8px;
  background: #f8fcfe; font-size: 14px; color: #0b2a4a;
  box-sizing: border-box; font-family: inherit;
}
.bsa-input:focus {
  outline: none; border-color: #1597a5;
  box-shadow: 0 0 0 3px rgba(21, 151, 165, 0.18);
  background: #fff;
}
.bsa-duration-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: #e8f6f8; color: #1597a5;
  padding: 2px 8px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600;
}
.bsa-slots-placeholder {
  padding: 20px; text-align: center;
  background: #f8fafc; border: 1px dashed #cbd5e1;
  border-radius: 10px; font-size: 13px; color: #64748b;
}
.bsa-slots-alert {
  padding: 14px; text-align: center;
  background: #fff7ed; border: 1px solid #fed7aa;
  border-radius: 10px; font-size: 13px; color: #c2410c; font-weight: 500;
}
.bsa-slots-skeleton {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); gap: 8px;
}
.bsa-skeleton-slot {
  height: 38px; border-radius: 8px; background: #eef4f6;
  animation: bsaPulse 1.2s infinite ease-in-out;
}
.bsa-slots-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 8px; max-height: 160px; overflow-y: auto; padding: 2px;
}
.bsa-slot-pill {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  padding: 9px 6px; border: 1.5px solid #d6e8ec; border-radius: 8px;
  background: #fff; color: #0b2a4a; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s ease; font-family: inherit;
}
.bsa-slot-pill:hover:not(:disabled) {
  border-color: #1597a5; background: #f0fafb; color: #1597a5;
}
.bsa-slot-pill.selected {
  border-color: #1597a5; background: #1597a5; color: #fff;
  box-shadow: 0 4px 10px rgba(21, 151, 165, 0.25);
}
.bsa-slot-pill.booked {
  background: #f1f5f9; border-color: #e2e8f0; color: #94a3b8;
  cursor: not-allowed; text-decoration: line-through;
  flex-direction: column; gap: 2px; font-size: 11px;
}
.bsa-booked-tag {
  font-size: 9px; font-weight: 700; color: #ef4444; text-decoration: none;
}
.bsa-popular-tag {
  position: absolute; top: -5px; right: -4px;
  font-size: 8.5px; font-weight: 800; background: #fef3c7; color: #b45309;
  padding: 1px 4px; border-radius: 4px; border: 1px solid #fde68a;
}
.bsa-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 22px; }
@media (max-width: 480px) {
  .bsa-card { padding: 20px 14px; max-height: 96vh; }
  .bsa-slots-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
  .bsa-input { font-size: 16px; }
  .bsa-actions { flex-direction: column-reverse; }
  .bsa-actions .bsa-btn { width: 100%; }
}
.bsa-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 11px 20px; border-radius: 10px; font-size: 13.5px; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.15s ease; font-family: inherit;
}
.bsa-btn-primary { background: #1597a5; color: #fff; }
.bsa-btn-primary:hover:not(:disabled) { background: #0f7f8b; transform: translateY(-1px); }
.bsa-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.bsa-btn-ghost { background: transparent; color: #5b6f86; }
.bsa-btn-ghost:hover { background: #f1f5f9; color: #0b2a4a; }

/* Summary Card */
.bsa-summary-box {
  background: #f8fcfe; border: 1px solid #dceef2; border-radius: 12px;
  padding: 12px 16px; text-align: left;
}
.bsa-summary-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #edf5f7; font-size: 13px;
}
.bsa-summary-row span { color: #5b6f86; font-size: 12.5px; }
.bsa-summary-row strong { color: #0b2a4a; font-weight: 600; }

/* Success */
.bsa-success { text-align: center; padding: 18px 8px; position: relative; }
.bsa-success-icon {
  display: grid; place-items: center;
  width: 76px; height: 76px; margin: 0 auto 12px;
  background: #d6efe8; color: #0b6b57; border-radius: 50%;
  animation: bsaBounce 0.4s ease;
}
.bsa-ref-pill {
  display: inline-block; padding: 4px 12px; border-radius: 999px;
  background: #e8f6f8; color: #1597a5; font-size: 12px; font-weight: 600;
  margin-bottom: 10px; border: 1px solid #bfe3e8;
}

/* Calendar integration action buttons */
.bsa-calendar-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px;
}
@media (max-width: 500px) {
  .bsa-calendar-actions { grid-template-columns: 1fr; }
}
.bsa-cal-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px;
  background: #ffffff; border: 1px solid #d6e8ec; color: #0b2a4a;
  font-size: 12px; font-weight: 600; text-decoration: none; cursor: pointer;
  transition: all 0.15s ease;
}
.bsa-cal-btn:hover {
  background: #f8fcfe; border-color: #1597a5; color: #1597a5;
  transform: translateY(-1px);
}

/* Confetti particles */
.bsa-confetti-container {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; overflow: hidden; z-index: 5;
}
.bsa-confetti-piece {
  position: absolute; width: 8px; height: 12px; top: 20%; left: 50%;
  border-radius: 2px; opacity: 0;
}
.bsa-confetti-piece.p-1 { background: #1597a5; animation: confettiBurst1 1.2s ease-out forwards; }
.bsa-confetti-piece.p-2 { background: #22c55e; animation: confettiBurst2 1.3s ease-out 0.05s forwards; }
.bsa-confetti-piece.p-3 { background: #f59e0b; animation: confettiBurst3 1.1s ease-out 0.1s forwards; }
.bsa-confetti-piece.p-4 { background: #ec4899; animation: confettiBurst4 1.4s ease-out 0.08s forwards; }
.bsa-confetti-piece.p-5 { background: #3b82f6; animation: confettiBurst5 1.2s ease-out 0.02s forwards; }
.bsa-confetti-piece.p-6 { background: #8b5cf6; animation: confettiBurst6 1.3s ease-out 0.12s forwards; }

@keyframes confettiBurst1 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg); } 100% { opacity: 0; transform: translate(-140px, -180px) rotate(420deg); } }
@keyframes confettiBurst2 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg); } 100% { opacity: 0; transform: translate(140px, -170px) rotate(-380deg); } }
@keyframes confettiBurst3 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg); } 100% { opacity: 0; transform: translate(-190px, -70px) rotate(320deg); } }
@keyframes confettiBurst4 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg); } 100% { opacity: 0; transform: translate(190px, -60px) rotate(-450deg); } }
@keyframes confettiBurst5 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg); } 100% { opacity: 0; transform: translate(-80px, 120px) rotate(260deg); } }
@keyframes confettiBurst6 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg); } 100% { opacity: 0; transform: translate(90px, 110px) rotate(-290deg); } }

@keyframes bsaFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bsaScaleUp { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes bsaPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
@keyframes bsaPulseDot { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); } 70% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
@keyframes bsaBounce { 0% { transform: scale(0.6); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
@keyframes bsaFadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;
