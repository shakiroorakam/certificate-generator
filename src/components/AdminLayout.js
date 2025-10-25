import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjusted path

const AdminLayout = ({ session }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            navigate('/'); // Redirect to login page after logout
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            {/* Sidebar */}
            <nav id="sidebar" className={`bg-dark text-white p-4 shadow ${isSidebarOpen ? '' : 'd-none'}`} style={{ width: '250px', transition: 'width 0.3s' }}>
                <h3 className="text-primary mb-4 fw-bold">Admin Panel</h3>
                <ul className="nav flex-column mb-auto">
                    <li className="nav-item mb-2">
                        <Link to="/admin" className="nav-link text-white fs-5">
                            <i className="bi bi-speedometer2 me-2"></i>Dashboard
                        </Link>
                    </li>
                    <li className="nav-item mb-2">
                        <Link to="/admin/create-event" className="nav-link text-white fs-5">
                            <i className="bi bi-calendar-plus me-2"></i>Create Event
                        </Link>
                    </li>
                    {/* Add more admin navigation links here */}
                </ul>
                <hr className="text-secondary" />
                <div className="dropdown">
                    <button className="btn btn-outline-light w-100" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                    </button>
                    <small className="d-block text-muted text-center mt-2">{session?.user?.email}</small>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Top Navbar for Toggle */}
                <header className="bg-white shadow-sm p-3 d-flex justify-content-between align-items-center sticky-top">
                    <button className="btn btn-outline-secondary" onClick={toggleSidebar}>
                        <i className={`bi ${isSidebarOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
                    </button>
                    <h1 className="h4 mb-0 text-primary">Certificate Generator</h1>
                    {/* You can add user profile/settings here if needed */}
                </header>

                {/* Page Content */}
                <main className="p-4 flex-grow-1">
                    <Outlet /> {/* Child routes will render here */}
                </main>

                {/* Footer */}
                <footer className="bg-light text-center p-3 border-top">
                    <small className="text-muted">&copy; {new Date().getFullYear()} Certificate Generator Admin</small>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;

