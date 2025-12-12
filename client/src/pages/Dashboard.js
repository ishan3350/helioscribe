import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Routes, Route, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getDashboardData } from '../services/authService';
import { formatErrorForDisplay } from '../utils/errorHandler';
import Sidebar from '../components/Sidebar';
import Security from './Security';
import AddWebsite from './AddWebsite';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const successMessageShown = useRef(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Check if token is in URL (from Google OAuth redirect)
      // Note: PrivateRoute should have already saved it, but check here too
      const urlToken = searchParams.get('token');
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        // Remove token from URL
        setSearchParams({}, { replace: true });
      }

      // Ensure we have a token before making API calls
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        navigate('/login');
        return;
      }

      try {
        const response = await getDashboardData();
        if (response.success) {
          setUser(response.data.user);
          // Store user data in localStorage
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
          
          // Show success message only once if we just logged in via OAuth
          if (urlToken && !successMessageShown.current) {
            successMessageShown.current = true;
            toast.success('Welcome! You\'ve been successfully signed in.', {
              position: 'top-right',
              autoClose: 2000,
            });
          }
        }
      } catch (error) {
        const errorMessage = formatErrorForDisplay(error);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            navigate('/login');
          }, 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, searchParams, setSearchParams]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('You\'ve been signed out successfully. We hope to see you again soon!');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <div className="dashboard-wrapper">
        <main className="dashboard-main">
          <Routes>
            <Route path="/" element={<DashboardHome user={user} formatDate={formatDate} />} />
            <Route path="settings/security" element={<Security />} />
            <Route path="websites/add" element={<AddWebsite />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = ({ user, formatDate }) => {
  return (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h2>Welcome back, {user?.firstName}</h2>
        <p>Account overview and information</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <h3>Profile Information</h3>
          </div>
          <div className="card-content">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone</span>
              <span className="info-value">{user?.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Address</span>
              <span className="info-value">{user?.address}</span>
            </div>
            <div className="info-item">
              <span className="info-label">How You Heard About Us</span>
              <span className="info-value">{user?.howHeard}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card stats-card">
          <div className="card-header">
            <h3>Account Statistics</h3>
          </div>
          <div className="card-content">
            <div className="stat-item">
              <div className="stat-indicator verified-indicator"></div>
              <div className="stat-details">
                <span className="stat-label">Email Status</span>
                <span className="stat-value verified">
                  {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-indicator date-indicator"></div>
              <div className="stat-details">
                <span className="stat-label">Account Created</span>
                <span className="stat-value">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-indicator time-indicator"></div>
              <div className="stat-details">
                <span className="stat-label">Last Login</span>
                <span className="stat-value">{formatDate(user?.lastLogin)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

