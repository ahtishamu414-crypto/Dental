import { useState, useEffect } from 'react';
import { 
  ArrowLeft, LogOut, Settings, CheckCircle2, Info, UserPlus, 
  Calendar, Clock, Check, X, Search, RefreshCw, AlertCircle, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clinicAPI, appointmentsAPI } from '../services/api';
import AddStaffModal from '../components/AddStaffModal';

export default function AdminDashboard({ onNavigate }) {
  const { user, logout } = useAuth();
  
  // Active Tab: 'appointments' or 'services'
  const [activeTab, setActiveTab] = useState('appointments');
  
  // Data state
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Filtering & search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [staffOpen, setStaffOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      onNavigate('home');
      return;
    }
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [servicesRes, apptsRes] = await Promise.allSettled([
        clinicAPI.getServices(),
        appointmentsAPI.getAll()
      ]);

      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value.data || []);
      }
      if (apptsRes.status === 'fulfilled') {
        setAppointments(apptsRes.value.data?.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (service, newPrice) => {
    const price = newPrice.trim();
    if (price === String(service.price)) return;

    try {
      await clinicAPI.updateService(service.id, { price });
      showToast('Price updated successfully. The AI receptionist will now use the new price.');
      const res = await clinicAPI.getServices();
      setServices(res.data || []);
    } catch (err) {
      alert('Failed to update price. Please check your connection.');
    }
  };

  const handleUpdateStatus = async (appointment, newStatus, reason = '') => {
    setUpdatingId(appointment.id);
    try {
      const payload = {
        status: newStatus,
        confirmed_by: user?.full_name || 'Clinic Administrator',
        notes: reason || (newStatus === 'confirmed' ? 'Accepted by clinic administrator' : appointment.notes || '')
      };

      await appointmentsAPI.updateStatus(appointment.id, payload);

      // Update local state immediately
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointment.id ? { ...a, status: newStatus } : a))
      );

      if (newStatus === 'confirmed') {
        showToast(`✅ Request for ${appointment.patient_name} accepted! Patient confirmation email dispatched.`);
      } else if (newStatus === 'cancelled') {
        showToast(`Appointment for ${appointment.patient_name} marked as cancelled.`);
      } else if (newStatus === 'completed') {
        showToast(`Visit for ${appointment.patient_name} marked as completed.`);
      } else {
        showToast(`Status updated to ${newStatus}.`);
      }
    } catch (err) {
      console.error('Failed to update appointment status:', err);
      const detail = err.response?.data?.detail || 'Failed to update request status.';
      setErrorMessage(detail);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const showToast = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleStaffAdded = () => {
    showToast('Staff account created. They can now sign in with their credentials.');
  };

  // Metrics calculations
  const pendingRequests = appointments.filter((a) => a.status === 'pending');
  const confirmedVisits = appointments.filter((a) => a.status === 'confirmed');
  const cancelledVisits = appointments.filter((a) => a.status === 'cancelled');
  const completedVisits = appointments.filter((a) => a.status === 'completed');

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      a.patient_name?.toLowerCase().includes(query) ||
      a.patient_email?.toLowerCase().includes(query) ||
      a.patient_phone?.toLowerCase().includes(query) ||
      a.service_type?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container page">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={26} color="#1597a5" /> Clinic Administration
          </h1>
          <p>Review incoming appointment requests, accept bookings, and manage live pricing.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={loadAllData} className="btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button type="button" onClick={() => setStaffOpen(true)} className="btn-primary btn-sm">
            <UserPlus size={14} /> Add staff member
          </button>
          <button type="button" onClick={() => onNavigate('home')} className="btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back to site
          </button>
          <button type="button" onClick={logout} className="btn-secondary btn-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="toast-ok" role="status">
          <CheckCircle2 size={18} /> {message}
        </div>
      )}
      {errorMessage && (
        <div className="alert-error" role="alert" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} style={{ display: 'inline', marginRight: 6 }} /> {errorMessage}
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: pendingRequests.length > 0 ? '4px solid #f59e0b' : '1px solid var(--line)' }}>
          <span className="metric-icon" style={{ background: '#fff4dc', color: '#8a5a00' }}>
            <Clock size={22} />
          </span>
          <div>
            <div className="metric-number">{pendingRequests.length}</div>
            <div className="metric-label">Pending Requests</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon" style={{ background: '#d6efe8', color: '#0b6b57' }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="metric-number">{confirmedVisits.length}</div>
            <div className="metric-label">Confirmed Visits</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">
            <Calendar size={22} />
          </span>
          <div>
            <div className="metric-number">{appointments.length}</div>
            <div className="metric-label">Total Requests</div>
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-icon">
            <Settings size={22} />
          </span>
          <div>
            <div className="metric-number">{services.length}</div>
            <div className="metric-label">Active Services</div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="tab-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={16} /> Appointment Requests
          {pendingRequests.length > 0 && (
            <span className="tab-count urgent">{pendingRequests.length} pending</span>
          )}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <Settings size={16} /> Dental Services & Dynamic Pricing
          <span className="tab-count">{services.length}</span>
        </button>
      </div>

      {/* TAB 1: APPOINTMENT REQUESTS */}
      {activeTab === 'appointments' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Incoming Patient Requests</h3>
              <p className="small-note" style={{ marginTop: 2 }}>
                Review and accept appointment requests submitted via the AI Receptionist or Booking Form.
              </p>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', gap: 6, background: 'var(--aqua-soft)', padding: 4, borderRadius: 8, overflowX: 'auto', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
                {[
                  { id: 'all', label: `All (${appointments.length})` },
                  { id: 'pending', label: `Pending (${pendingRequests.length})` },
                  { id: 'confirmed', label: `Confirmed (${confirmedVisits.length})` },
                  { id: 'completed', label: `Completed (${completedVisits.length})` },
                  { id: 'cancelled', label: `Cancelled (${cancelledVisits.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: statusFilter === tab.id ? 'var(--teal)' : 'transparent',
                      color: statusFilter === tab.id ? '#fff' : 'var(--muted)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', minWidth: 160, flex: '1 1 180px', maxWidth: 260 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  placeholder="Search patient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, paddingVertical: 6, fontSize: '12.5px', height: 32 }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <p className="small-note" style={{ textAlign: 'center', padding: 50 }}>Loading appointment requests…</p>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state" style={{ margin: 24 }}>
              <Calendar size={36} />
              <p>No appointment requests found.</p>
              <p className="small-note">
                {statusFilter !== 'all' ? `No appointments with status "${statusFilter}".` : 'No bookings have been made yet.'}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Patient Information</th>
                    <th style={{ width: '20%' }}>Requested Service</th>
                    <th style={{ width: '18%' }}>Preferred Schedule</th>
                    <th style={{ width: '15%' }}>Status</th>
                    <th style={{ width: '25%', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{app.patient_name}</div>
                        <div className="small-note">{app.patient_email}</div>
                        <div className="small-note">{app.patient_phone}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong>{app.service_type}</strong>
                          {app.duration_minutes && (
                            <span style={{ fontSize: '11px', background: '#e8f6f8', color: '#1597a5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              {app.duration_minutes}m
                            </span>
                          )}
                        </div>
                        <div className="small-note" style={{ color: '#0b2a4a', fontWeight: 600, marginTop: 3 }}>
                          👨‍⚕️ {app.doctor_name || 'Any Available Doctor'}
                        </div>
                        {app.notes && (
                          <div className="small-note" style={{ marginTop: 4, fontStyle: 'italic', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                            "{app.notes}"
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                          <Calendar size={13} color="var(--teal)" /> {app.preferred_date}
                        </div>
                        <div className="small-note" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Clock size={12} color="var(--muted)" /> {app.preferred_time}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${app.status}`}>
                          {app.status}
                        </span>
                        {app.confirmed_by && (
                          <div className="small-note" style={{ marginTop: 4 }}>
                            by {app.confirmed_by}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* If pending: show Accept (Confirm) and Decline */}
                          {app.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={updatingId === app.id}
                                onClick={() => handleUpdateStatus(app, 'confirmed')}
                                className="btn-primary btn-sm btn-success"
                                title="Accept this appointment request and dispatch patient confirmation email"
                              >
                                <Check size={14} /> Accept Request
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === app.id}
                                onClick={() => handleUpdateStatus(app, 'cancelled')}
                                className="btn-secondary btn-sm btn-danger"
                                title="Decline this request"
                              >
                                <X size={14} /> Decline
                              </button>
                            </>
                          )}

                          {/* If confirmed: show Mark Completed or Cancel */}
                          {app.status === 'confirmed' && (
                            <>
                              <button
                                type="button"
                                disabled={updatingId === app.id}
                                onClick={() => handleUpdateStatus(app, 'completed')}
                                className="btn-secondary btn-sm"
                                style={{ borderColor: 'var(--teal)', color: 'var(--teal)' }}
                                title="Mark treatment completed"
                              >
                                <CheckCircle2 size={13} /> Complete Visit
                              </button>
                              <button
                                type="button"
                                disabled={updatingId === app.id}
                                onClick={() => handleUpdateStatus(app, 'cancelled')}
                                className="btn-secondary btn-sm btn-danger"
                                title="Cancel confirmed visit"
                              >
                                <X size={13} /> Cancel
                              </button>
                            </>
                          )}

                          {/* If cancelled: option to restore */}
                          {app.status === 'cancelled' && (
                            <button
                              type="button"
                              disabled={updatingId === app.id}
                              onClick={() => handleUpdateStatus(app, 'pending')}
                              className="btn-secondary btn-sm"
                            >
                              Restore to Pending
                            </button>
                          )}

                          {/* If completed */}
                          {app.status === 'completed' && (
                            <span className="small-note" style={{ color: '#0b6b57', fontWeight: 600 }}>
                              ✓ Patient visit completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DENTAL SERVICES & DYNAMIC PRICING */}
      {activeTab === 'services' && (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Dental Services and Dynamic Pricing</h3>
              <p className="small-note" style={{ marginTop: 2 }}>
                Click on any price to edit. Prices sync immediately with MongoDB and the AI receptionist.
              </p>
            </div>

            {loading ? (
              <p className="small-note" style={{ textAlign: 'center', padding: 50 }}>Loading clinic data…</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Service name</th>
                      <th style={{ width: '40%' }}>Description</th>
                      <th style={{ width: '20%' }}>Price (click to edit)</th>
                      <th style={{ width: '15%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td style={{ color: 'var(--muted)' }}>{s.description}</td>
                        <td>
                          <input
                            type="text"
                            defaultValue={s.price}
                            className="price-input"
                            aria-label={`Price for ${s.name}`}
                            onBlur={(e) => handlePriceUpdate(s, e.target.value)}
                          />
                        </td>
                        <td><span className="badge badge-confirmed">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="info-card">
            <h4><Info size={18} color="#1597a5" /> How dynamic pricing works</h4>
            <ul>
              <li>Update prices directly in the input fields above.</li>
              <li>Changes are saved instantly to MongoDB Atlas.</li>
              <li>The AI receptionist automatically fetches and uses the new prices.</li>
              <li>No server restart required. Changes are live immediately.</li>
            </ul>
          </div>
        </>
      )}

      <AddStaffModal isOpen={staffOpen} onClose={() => setStaffOpen(false)} onRefresh={handleStaffAdded} />
    </div>
  );
}
