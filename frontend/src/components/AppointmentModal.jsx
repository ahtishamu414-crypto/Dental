import { useState, useEffect } from 'react';
import { appointmentsAPI } from '../services/api';
import { 
  X, CheckCircle2, CalendarCheck, Clock, User, ShieldAlert, Check
} from 'lucide-react';

const SERVICES_CONFIG = [
  { name: 'General Checkup', duration: 30, price: 150 },
  { name: 'Professional Cleaning', duration: 45, price: 200 },
  { name: 'Dental Fillings', duration: 60, price: 250 },
  { name: 'Teeth Whitening', duration: 60, price: 450 },
  { name: 'Root Canal Therapy', duration: 90, price: 1200 },
  { name: 'Tooth Extraction', duration: 60, price: 300 },
  { name: 'Orthodontic Consultation', duration: 45, price: 180 },
];

const DOCTORS = [
  { id: 'Any Available Doctor', label: 'Any Available Doctor (Earliest opening)' },
  { id: 'Dr. Sarah Jenkins (General & Preventative)', label: 'Dr. Sarah Jenkins — General & Preventative' },
  { id: 'Dr. Michael Chen (Orthodontics & Cosmetic)', label: 'Dr. Michael Chen — Orthodontics & Cosmetic' },
  { id: 'Dr. Emily Rodriguez (Oral Surgery & Endodontics)', label: 'Dr. Emily Rodriguez — Surgery & Endodontics' }
];

const DEFAULT_SLOTS = [
  '9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM',
  '1:00 PM', '1:45 PM', '2:30 PM', '3:15 PM', '4:00 PM', '4:45 PM'
];

const EMPTY_FORM = {
  patient_name: '',
  patient_email: '',
  patient_phone: '',
  service_type: 'General Checkup',
  doctor_name: 'Any Available Doctor',
  preferred_date: '',
  preferred_time: '',
  notes: '',
};

export default function AppointmentModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time slot availability
  const [availableSlots, setAvailableSlots] = useState(DEFAULT_SLOTS);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotDuration, setSlotDuration] = useState(30);

  // Compute allowed date boundaries
  const todayObj = new Date();
  const today = todayObj.toISOString().split('T')[0];
  const maxDateObj = new Date();
  maxDateObj.setDate(todayObj.getDate() + 90);
  const maxDate = maxDateObj.toISOString().split('T')[0];

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && handleClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Reject past dates or far future
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
    if (bookedSlots.includes(time)) return; // Can't select booked slot
    setFormData((prev) => ({ ...prev, preferred_time: time }));
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setFormData(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict validation
    if (!formData.preferred_date) {
      setError('Please pick an appointment date.');
      return;
    }

    if (formData.preferred_date < today) {
      setError('Appointment date cannot be in the past.');
      return;
    }

    if (formData.preferred_date > maxDate) {
      setError('Appointments can only be booked up to 90 days in advance.');
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
        // Slot collision: another patient just booked it!
        setError(err.response?.data?.detail || 'That time slot was just reserved by another patient. Please choose another time.');
        // Refresh booked slots immediately
        setBookedSlots((prev) => [...new Set([...prev, formData.preferred_time])]);
        setFormData((prev) => ({ ...prev, preferred_time: '' }));
      } else {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Could not submit your request. Check the details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const allBooked = formData.preferred_date && availableSlots.length === 0;

  return (
    <>
      <style>{css}</style>

      <div className="bsa-overlay" onMouseDown={(e) => e.target === e.currentTarget && handleClose()}>
        <div className="bsa-card" role="dialog" aria-modal="true" aria-labelledby="bsa-title">
          <button type="button" className="bsa-close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>

          {success ? (
            <div className="bsa-success">
              <span className="bsa-success-icon">
                <CheckCircle2 size={36} />
              </span>
              <h3 id="bsa-title" className="bsa-title">Appointment Requested!</h3>
              <p className="bsa-sub">
                Your appointment request for <strong>{formData.preferred_date} at {formData.preferred_time}</strong> with <strong>{formData.doctor_name}</strong> has been received. Our clinic staff will confirm via email.
              </p>
              <button type="button" className="bsa-btn bsa-btn-primary" onClick={handleClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="bsa-header">
                <span className="bsa-icon">
                  <CalendarCheck size={22} />
                </span>
                <div>
                  <h3 id="bsa-title" className="bsa-title">Book an Appointment</h3>
                  <p className="bsa-sub">Select your doctor, treatment, and dedicated time slot.</p>
                </div>
              </div>

              {error && (
                <div className="bsa-error" role="alert">
                  <ShieldAlert size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Patient Name */}
                <div className="bsa-group">
                  <label className="bsa-label" htmlFor="bsa-name">Full name</label>
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
                    <label className="bsa-label" htmlFor="bsa-email">Email address</label>
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
                    <label className="bsa-label" htmlFor="bsa-phone">Phone number</label>
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

                {/* Service Selection */}
                <div className="bsa-group">
                  <label className="bsa-label" htmlFor="bsa-service">
                    Service & Treatment (Dedicated Duration)
                  </label>
                  <select
                    id="bsa-service"
                    className="bsa-input"
                    value={formData.service_type}
                    onChange={update('service_type')}
                  >
                    {SERVICES_CONFIG.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} — {s.duration} mins (${s.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection */}
                <div className="bsa-group">
                  <label className="bsa-label" htmlFor="bsa-doctor">
                    Preferred Doctor / Dentist
                  </label>
                  <select
                    id="bsa-doctor"
                    className="bsa-input"
                    value={formData.doctor_name}
                    onChange={update('doctor_name')}
                  >
                    {DOCTORS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker with Min/Max validation */}
                <div className="bsa-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="bsa-label" htmlFor="bsa-date">Appointment date</label>
                    <span className="bsa-hint">Today to 90 days out</span>
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

                {/* Real-time Time Slots Grid */}
                <div className="bsa-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="bsa-label" style={{ marginBottom: 0 }}>
                      Available Time Slots
                    </label>
                    <span className="bsa-duration-tag">
                      <Clock size={12} /> {slotDuration} mins duration
                    </span>
                  </div>

                  {!formData.preferred_date ? (
                    <div className="bsa-slots-placeholder">
                      Pick a date above to check available slots
                    </div>
                  ) : slotsLoading ? (
                    <div className="bsa-slots-placeholder">
                      Checking real-time doctor availability…
                    </div>
                  ) : allBooked ? (
                    <div className="bsa-slots-alert">
                      All slots for this doctor are booked on this date. Please select another date or doctor.
                    </div>
                  ) : (
                    <div className="bsa-slots-grid">
                      {DEFAULT_SLOTS.map((t) => {
                        const isBooked = bookedSlots.includes(t);
                        const isSelected = formData.preferred_time === t;
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
                            {isBooked && <span className="bsa-booked-tag">Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
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
                    placeholder="e.g. Tooth sensitivity or general checkup"
                  />
                </div>

                {/* Actions */}
                <div className="bsa-actions">
                  <button type="button" className="bsa-btn bsa-btn-ghost" onClick={handleClose}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bsa-btn bsa-btn-primary"
                    disabled={loading || !formData.preferred_date || !formData.preferred_time}
                  >
                    {loading ? 'Securing slot…' : 'Reserve Appointment'}
                  </button>
                </div>
              </form>
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
  background: rgba(11, 42, 74, 0.55);
  backdrop-filter: blur(4px);
}
.bsa-card {
  position: relative;
  width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto;
  padding: 28px;
  background: #ffffff;
  border-radius: 16px;
  border-top: 4px solid #1597a5;
  box-shadow: 0 20px 50px rgba(11, 42, 74, 0.25);
  font-family: inherit;
}
.bsa-close {
  position: absolute; top: 16px; right: 16px;
  display: grid; place-items: center;
  width: 32px; height: 32px;
  background: #f1f7f9; border: none; border-radius: 50%;
  color: #5b6f86; cursor: pointer;
  transition: background 0.15s;
}
.bsa-close:hover { background: #e0eff2; color: #0b2a4a; }
.bsa-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.bsa-icon {
  display: grid; place-items: center;
  width: 44px; height: 44px;
  background: #e8f6f8; color: #1597a5;
  border-radius: 12px; flex-shrink: 0;
}
.bsa-title { font-size: 1.25rem; font-weight: 700; color: #0b2a4a; margin: 0; }
.bsa-sub { font-size: 13px; color: #5b6f86; margin-top: 2px; }
.bsa-hint { font-size: 11.5px; color: #1597a5; font-weight: 600; }
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
  width: 100%; padding: 9px 12px;
  border: 1px solid #cfe3e8; border-radius: 8px;
  background: #f8fcfe; font-size: 13.5px; color: #0b2a4a;
  box-sizing: border-box;
}
.bsa-input:focus {
  outline: none; border-color: #1597a5;
  box-shadow: 0 0 0 3px rgba(21, 151, 165, 0.15);
  background: #fff;
}
.bsa-duration-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: #e8f6f8; color: #1597a5;
  padding: 2px 8px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600;
}
.bsa-slots-placeholder {
  padding: 16px; text-align: center;
  background: #f8fafc; border: 1px dashed #cbd5e1;
  border-radius: 8px; font-size: 12.5px; color: #64748b;
}
.bsa-slots-alert {
  padding: 12px; text-align: center;
  background: #fff7ed; border: 1px solid #fed7aa;
  border-radius: 8px; font-size: 12.5px; color: #c2410c; font-weight: 500;
}
.bsa-slots-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 8px; max-height: 140px; overflow-y: auto; padding: 2px;
}
.bsa-slot-pill {
  display: flex; align-items: center; justify-content: center;
  padding: 8px 6px; border: 1.5px solid #d6e8ec; border-radius: 8px;
  background: #fff; color: #0b2a4a; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s ease;
}
.bsa-slot-pill:hover:not(:disabled) {
  border-color: #1597a5; background: #f0fafb; color: #1597a5;
}
.bsa-slot-pill.selected {
  border-color: #1597a5; background: #1597a5; color: #fff;
}
.bsa-slot-pill.booked {
  background: #f1f5f9; border-color: #e2e8f0; color: #94a3b8;
  cursor: not-allowed; text-decoration: line-through;
  flex-direction: column; gap: 2px; font-size: 11px;
}
.bsa-booked-tag {
  font-size: 9px; font-weight: 700; color: #ef4444; text-decoration: none;
}
.bsa-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.bsa-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 600;
  cursor: pointer; border: none; transition: background 0.15s ease;
}
.bsa-btn-primary { background: #1597a5; color: #fff; }
.bsa-btn-primary:hover:not(:disabled) { background: #0f7f8b; }
.bsa-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.bsa-btn-ghost { background: transparent; color: #5b6f86; }
.bsa-btn-ghost:hover { background: #f1f5f9; }
.bsa-success { text-align: center; padding: 24px 8px; }
.bsa-success-icon {
  display: grid; place-items: center;
  width: 64px; height: 64px; margin: 0 auto 16px;
  background: #d6efe8; color: #0b6b57; border-radius: 50%;
}
`;
