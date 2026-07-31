/**
 * App Component
 * 
 * Root application component with routing configuration.
 * Implements role-based protected routes and lazy loading.
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout';
import Spinner from './components/ui/Spinner';

// Auth Pages (eager load)
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';

// Landing Page
import LandingPage from './features/landing/LandingPage';

// Patient Pages
import PatientDashboard from './features/patient/PatientDashboard';
import PatientProfile from './features/patient/PatientProfile';
import MedicalHistory from './features/patient/MedicalHistory';
import DoctorSearch from './features/patient/DoctorSearch';
import DoctorDetail from './features/patient/DoctorDetail';
import BookAppointment from './features/patient/BookAppointment';
import MyAppointments from './features/patient/MyAppointments';
import AppointmentDetail from './features/patient/AppointmentDetail';
import MyPrescriptions from './features/patient/MyPrescriptions';
import MyPayments from './features/patient/MyPayments';
import Emergency from './features/emergency/Emergency';
import SymptomsPage from './features/patient/SymptomsPage';

// Doctor Pages
import DoctorDashboard from './features/doctor/DoctorDashboard';
import DoctorProfile from './features/doctor/DoctorProfile';
import DoctorPatients from './features/doctor/DoctorPatients';
import PatientHistoryView from './features/doctor/PatientHistoryView';
import DoctorAppointments from './features/doctor/DoctorAppointments';
import ConsultationPage from './features/doctor/ConsultationPage';
import VerificationPage from './features/doctor/VerificationPage';

// Admin Pages
import AdminDashboard from './features/admin/AdminDashboard';
import ManageUsers from './features/admin/ManageUsers';
import ManageDoctors from './features/admin/ManageDoctors';
import VerificationRequests from './features/admin/VerificationRequests';
import VerificationDetail from './features/admin/VerificationDetail';
import AdminAppointments from './features/admin/AdminAppointments';
import AdminPayments from './features/admin/AdminPayments';
import AuditLogs from './features/admin/AuditLogs';

// Error Pages
import NotFound from './features/errors/NotFound';

/**
 * Protected Route wrapper
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Spinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

/**
 * Guest Route — redirects authenticated users to their dashboard
 */
function GuestRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Spinner fullPage />;
  }

  if (isAuthenticated) {
    const dashboardMap = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={dashboardMap[user?.role] || '/patient/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

        {/* Patient Routes */}
        <Route path="/patient" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DashboardLayout role="patient" />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="medical-history" element={<MedicalHistory />} />
          <Route path="doctors" element={<DoctorSearch />} />
          <Route path="doctors/:id" element={<DoctorDetail />} />
          <Route path="book-appointment/:doctorId" element={<BookAppointment />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="appointments/:id" element={<AppointmentDetail />} />
          <Route path="prescriptions" element={<MyPrescriptions />} />
          <Route path="payments" element={<MyPayments />} />
          <Route path="symptoms" element={<SymptomsPage />} />
          <Route path="emergency" element={<Emergency />} />
        </Route>

        {/* Doctor Routes */}
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DashboardLayout role="doctor" />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="profile" element={<DoctorProfile />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id/history" element={<PatientHistoryView />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="appointments/:id/consultation" element={<ConsultationPage />} />
          <Route path="verification" element={<VerificationPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="doctors" element={<ManageDoctors />} />
          <Route path="verifications" element={<VerificationRequests />} />
          <Route path="verifications/:id" element={<VerificationDetail />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Error Routes */}
        <Route path="/unauthorized" element={
          <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="text-center">
              <i className="bi bi-shield-exclamation text-danger" style={{ fontSize: '4rem' }}></i>
              <h2 className="mt-3">Access Denied</h2>
              <p className="text-muted">You don't have permission to access this page.</p>
              <a href="/" className="hd-btn hd-btn-primary mt-3">Go Home</a>
            </div>
          </div>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
