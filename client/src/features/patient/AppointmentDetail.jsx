import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { appointmentAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/ui/Spinner';

export default function AppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointment = async () => {
    try {
      const { data: res } = await appointmentAPI.getById(id);
      setAppointment(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchAppointment(); }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await appointmentAPI.cancel(id);
      toast.success('Appointment cancelled');
      fetchAppointment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
    setCancelling(false);
  };

  const handlePay = async () => {
    try {
      const { data: res } = await paymentAPI.createOrder({
        appointmentId: parseInt(id),
      });

      const order = res.data;

      const options = {
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        order_id: order.orderId,

        name: "HealthDesk",
        description: "Doctor Consultation",

        handler: async (response) => {
          try {
            await paymentAPI.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            toast.success("Payment Successful");
            fetchAppointment();
          } catch (err) {
            toast.error("Payment verification failed");
          }
        },

        prefill: {
          name: apt.patient_first_name || "",
          email: apt.patient_email || "",
          contact: apt.patient_phone || "",
        },

        theme: {
          color: "#0d6efd",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        toast.error(response.error.description || "Payment Failed");
      });

      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment Failed");
    }
  };

  if (loading) return <Spinner />;
  if (!appointment) return <div className="hd-card"><div className="hd-empty-state"><h5>Appointment Not Found</h5><Link to="/patient/appointments" className="hd-btn hd-btn-primary mt-3">Back</Link></div></div>;

  const apt = appointment;

  return (
    <div>
      <div className="mb-3"><Link to="/patient/appointments" className="text-muted small"><i className="bi bi-arrow-left me-1"></i>Back to Appointments</Link></div>

      <div className="hd-page-header">
        <div>
          <h1 className="hd-page-title">Appointment #{apt.id}</h1>
          <p className="hd-page-subtitle">Booked on {new Date(apt.created_at).toLocaleDateString()}</p>
        </div>
        <div className="d-flex gap-2">
          {['pending', 'accepted'].includes(apt.status) && !apt.is_paid && apt.status === 'accepted' && (
            <button className="hd-btn hd-btn-success" onClick={handlePay}><i className="bi bi-credit-card"></i> Pay ₹{apt.consultation_fee}</button>
          )}
          {['pending', 'accepted'].includes(apt.status) && (
            <button className="hd-btn hd-btn-danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : <><i className="bi bi-x-lg"></i> Cancel</>}
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Main Info */}
        <div className="col-lg-8">
          <div className="hd-card mb-4">
            <h4 className="mb-3">Appointment Details</h4>
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Status</div>
                <span className={`hd-badge hd-badge-${apt.status}`}>{apt.status}</span>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Type</div>
                <span className="fw-semibold text-capitalize"><i className={`bi ${apt.consultation_type === 'online' ? 'bi-camera-video' : 'bi-hospital'} me-1`}></i>{apt.consultation_type}</span>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Date</div>
                <span className="fw-semibold">{apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'To be decided'}</span>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Time</div>
                <span className="fw-semibold">{apt.appointment_time || 'To be decided'}</span>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Consultation Fee</div>
                <span className="fw-bold text-success fs-5">₹{apt.consultation_fee || 0}</span>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Payment Status</div>
                <span className={`hd-badge ${apt.is_paid ? 'hd-badge-paid' : 'hd-badge-pending'}`}>{apt.is_paid ? 'Paid' : 'Unpaid'}</span>
              </div>
            </div>
            {apt.reason && (
              <div className="mt-3"><div className="small text-muted mb-1">Reason for Visit</div><p className="mb-0">{apt.reason}</p></div>
            )}
            {apt.notes && (
              <div className="mt-3"><div className="small text-muted mb-1">Doctor's Notes</div><p className="mb-0">{apt.notes}</p></div>
            )}
            {apt.rejection_reason && (
              <div className="mt-3 p-3 rounded" style={{ background: 'var(--hd-danger-light)' }}><div className="small text-muted mb-1">Rejection Reason</div><p className="mb-0 text-danger">{apt.rejection_reason}</p></div>
            )}
          </div>

          {/* Prescription */}
          {apt.prescription && (
            <div className="hd-card">
              <h4 className="mb-3"><i className="bi bi-prescription2 text-primary me-2"></i>Prescription</h4>
              <div className="row g-3">
                <div className="col-md-6"><div className="small text-muted">Diagnosis</div><p className="fw-semibold">{apt.prescription.diagnosis}</p></div>
                <div className="col-md-6"><div className="small text-muted">Medications</div><p>{apt.prescription.medications}</p></div>
                {apt.prescription.instructions && <div className="col-12"><div className="small text-muted">Instructions</div><p>{apt.prescription.instructions}</p></div>}
              </div>
            </div>
          )}
        </div>

        {/* Doctor Card */}
        <div className="col-lg-4">
          <div className="hd-card">
            <h5 className="mb-3">Doctor Information</h5>
            <div className="text-center mb-3">
              {apt.doctor_image ? <img src={apt.doctor_image} alt="" className="hd-avatar-xl" /> : <div className="hd-avatar-placeholder xl mx-auto">{apt.doctor_first_name?.[0]}{apt.doctor_last_name?.[0]}</div>}
              <h5 className="mt-2 mb-0">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</h5>
              <p className="text-muted small">{apt.specialization}</p>
            </div>
            <div className="d-flex flex-column gap-2">
              {apt.hospital_name && <div className="small"><i className="bi bi-hospital text-primary me-2"></i>{apt.hospital_name}</div>}
              {apt.doctor_phone && <div className="small"><i className="bi bi-telephone me-2"></i>{apt.doctor_phone}</div>}
              {apt.doctor_email && <div className="small"><i className="bi bi-envelope me-2"></i>{apt.doctor_email}</div>}
            </div>
            {apt.upi_id && !apt.is_paid && apt.status === 'accepted' && (
              <>
                <hr />
                <div className="small text-muted mb-1">UPI Payment</div>
                <div className="fw-semibold">{apt.upi_id}</div>
                {apt.upi_qr_url && <img src={apt.upi_qr_url} alt="QR" className="mt-2 rounded w-100" />}
              </>
            )}
          </div>

          {/* Payment Details */}
          {apt.payment && (
            <div className="hd-card mt-4">
              <h5 className="mb-3">Payment Details</h5>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between"><span className="text-muted">Amount</span><span className="fw-bold">₹{apt.payment.amount}</span></div>
                <div className="d-flex justify-content-between"><span className="text-muted">Status</span><span className={`hd-badge hd-badge-${apt.payment.status}`}>{apt.payment.status}</span></div>
                {apt.payment.paid_at && <div className="d-flex justify-content-between"><span className="text-muted">Paid At</span><span>{new Date(apt.payment.paid_at).toLocaleString()}</span></div>}
                {apt.payment.razorpay_payment_id && <div className="d-flex justify-content-between"><span className="text-muted">Transaction ID</span><span className="small">{apt.payment.razorpay_payment_id}</span></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
