import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI } from '../services/api';
import { Calendar, Clock, User, PlusCircle, CheckCircle2, HeartPulse } from 'lucide-react';

export default function PatientDashboard({ onOpenModal }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appointmentsAPI.getMy()
      .then((res) => setAppointments(res.data?.appointments || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  const metrics = [
    { icon: Calendar, value: appointments.length, label: 'Total requests' },
    { icon: CheckCircle2, value: confirmedCount, label: 'Confirmed visits' },
    { icon: Clock, value: pendingCount, label: 'Pending verification' },
    { icon: HeartPulse, value: 'Active', label: 'Account status' },
  ];

  return (
    <div className="container page">
      <div className="dash-header">
        <div>
          <span className="pill">Patient portal</span>
          <h1 style={{ marginTop: 10 }}>Welcome back, {user?.full_name || 'Patient'}!</h1>
          <p>Manage your dental visits, check request status, and view care guidelines.</p>
        </div>
        <button type="button" onClick={onOpenModal} className="btn-primary">
          <PlusCircle size={16} /> Request Appointment
        </button>
      </div>

      <div className="metrics-grid">
        {metrics.map(({ icon: Icon, value, label }) => (
          <div key={label} className="metric-card">
            <span className="metric-icon"><Icon size={22} /></span>
            <div>
              <div className="metric-number">{value}</div>
              <div className="metric-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <h3>My appointment requests</h3>
            <button type="button" onClick={onOpenModal} className="btn-secondary btn-sm">+ New request</button>
          </div>

          {loading ? (
            <p className="small-note" style={{ textAlign: 'center', padding: '30px 0' }}>Loading your appointments…</p>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={36} />
              <p>No appointment requests yet.</p>
              <p className="small-note">Need a checkup or teeth cleaning?</p>
              <button type="button" onClick={onOpenModal} className="btn-primary btn-sm">Schedule a visit</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Treatment service</th>
                    <th>Preferred date and time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong>{item.service_type}</strong>
                          {item.duration_minutes && (
                            <span style={{ fontSize: '11px', background: '#e8f6f8', color: '#1597a5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {item.duration_minutes}m
                            </span>
                          )}
                        </div>
                        {item.doctor_name && (
                          <div className="small-note" style={{ color: '#0b2a4a', fontWeight: 500, marginTop: 2 }}>
                            👨‍⚕️ {item.doctor_name}
                          </div>
                        )}
                        {item.notes && <div className="small-note">Notes: {item.notes}</div>}
                      </td>
                      <td>
                        <div>{item.preferred_date}</div>
                        <div className="small-note">{item.preferred_time}</div>
                      </td>
                      <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head" style={{ marginBottom: 14 }}>
              <h3><User size={18} color="#1597a5" /> My profile</h3>
            </div>
            <dl className="kv">
              <div><dt>Full name</dt><dd>{user?.full_name || 'N/A'}</dd></div>
              <div><dt>Email address</dt><dd>{user?.email || 'N/A'}</dd></div>
              <div><dt>Phone number</dt><dd>{user?.phone || 'Not provided'}</dd></div>
            </dl>
          </div>

          <div className="card tip-card">
            <h4>Patient preparation tip</h4>
            <p>
              Please arrive 15 minutes before your confirmed time slot to complete initial health declaration
              forms. Bring your photo ID and insurance details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
