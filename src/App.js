import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Adjusted path

// Import Layouts
import AdminLayout from './components/AdminLayout'; // General admin layout with sidebar

// Import Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateEvent from './pages/admin/CreateEvent';
import ManageEvent from './pages/admin/ManageEvent'; // This will use its own layout
import EventPage from './pages/user/EventPage';

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css'; // Your custom styles including sidebar CSS

// Higher-Order Component to protect admin routes
const ProtectedRoute = ({ session, children }) => {
    if (!session) {
        return <Navigate to="/" replace />;
    }
    return children;
};

const App = () => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                // No need to set loading here again unless there's an initial check delay
            }
        );

        // Cleanup subscription on unmount
        return () => subscription?.unsubscribe();
    }, []);

    if (loading) {
        // Optional: Add a nicer loading screen later
        return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border"></div></div>;
    }

    return (
        <HashRouter>
            <Routes>
                {/* Public Route for Event Certificate */}
                <Route path="/event/:eventId" element={<EventPage />} />

                {/* Login Route (Root Path) */}
                {/* If already logged in, redirect to admin dashboard */}
                <Route
                    path="/"
                    element={session ? <Navigate to="/admin" replace /> : <AdminLogin />}
                />

                {/* Admin Routes */}
                {/* General Admin Layout */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute session={session}>
                            <AdminLayout session={session}>
                                <AdminDashboard session={session} />
                            </AdminLayout>
                        </ProtectedRoute>
                    }
                />
                 <Route
                    path="/admin/create-event"
                    element={
                        <ProtectedRoute session={session}>
                            <AdminLayout session={session}>
                                <CreateEvent session={session} />
                            </AdminLayout>
                        </ProtectedRoute>
                    }
                />

                 {/* Manage Event Route - Uses its own internal layout */}
                 <Route
                    path="/admin/manage-event/:eventId"
                    element={
                        <ProtectedRoute session={session}>
                            {/* ManageEvent now renders its own sidebar layout */}
                            <ManageEvent session={session} />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all for unknown routes (optional) */}
                <Route path="*" element={<Navigate to={session ? "/admin" : "/"} replace />} />

            </Routes>
        </HashRouter>
    );
};

export default App;

