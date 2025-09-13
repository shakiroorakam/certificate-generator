import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateEvent from './pages/admin/CreateEvent';
import ManageEvent from './pages/admin/ManageEvent';
import EventPage from './pages/user/EventPage';

// Simple authentication check
const useAuth = () => {
    const loggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
    return loggedIn;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuth();
    return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
    return (
        <>
            {/* Bootstrap CSS and Icons are included here to apply globally */}
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet" />

            <HashRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<AdminLogin />} />
                    <Route path="/event/:eventId" element={<EventPage />} />

                    {/* Admin Routes */}
                    <Route 
                        path="/admin/dashboard" 
                        element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
                    />
                     <Route 
                        path="/admin/create-event" 
                        element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} 
                    />
                     <Route 
                        path="/admin/manage-event/:eventId" 
                        element={<ProtectedRoute><ManageEvent /></ProtectedRoute>} 
                    />

                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </HashRouter>
        </>
    );
};

export default App;
