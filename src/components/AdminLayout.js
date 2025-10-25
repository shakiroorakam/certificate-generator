import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjust path if needed

const AdminLayout = ({ children, session }) => {
    const location = useLocation(); // To highlight active link

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        // The App.js listener will handle redirecting
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' /* Light background */ }}>
            {/* Sidebar */}
            <nav className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark" style={{ width: '280px' }}>
                <Link to="/admin" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                    <i className="bi bi-shield-lock-fill me-2 fs-4"></i>
                    <span className="fs-4">Admin Panel</span>
                </Link>
                <hr />
                <ul className="nav nav-pills flex-column mb-auto">
                    <li className="nav-item">
                        <Link to="/admin" className={`nav-link text-white ${location.pathname === '/admin' ? 'active' : ''}`} aria-current="page">
                            <i className="bi bi-speedometer2 me-2"></i>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/create-event" className={`nav-link text-white ${location.pathname === '/admin/create-event' ? 'active' : ''}`}>
                            <i className="bi bi-calendar-plus-fill me-2"></i>
                            Create Event
                        </Link>
                    </li>
                    {/* Add other admin links here */}
                </ul>
                <hr />
                <div className="dropdown">
                    <a href="#/" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="bi bi-person-circle fs-4 me-2"></i>
                        <strong>{session?.user?.email || 'Admin'}</strong>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                        {/* <li><a className="dropdown-item" href="#/">Settings</a></li>
                        <li><a className="dropdown-item" href="#/">Profile</a></li>
                        <li><hr className="dropdown-divider" /></li> */}
                        <li><button className="dropdown-item" onClick={handleSignOut}>Sign out</button></li>
                    </ul>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-grow-1 d-flex flex-column">
                {/* Header (Optional - Can be simple or more complex) */}
                <header className="navbar navbar-light bg-light border-bottom sticky-top px-3">
                    <span className="navbar-brand mb-0 h1 text-primary">Certificate Generator</span>
                    {/* Add maybe breadcrumbs or user info here if needed */}
                </header>

                {/* Content */}
                <main className="flex-grow-1 p-4" style={{ backgroundColor: '#f0f2f5' }}>
                     {/* <<< CRITICAL: Render children passed to the layout >>> */}
                    {children}
                </main>

                {/* Footer (Optional) */}
                <footer className="footer mt-auto py-3 bg-light border-top text-center">
                    <div className="container">
                        <span className="text-muted">&copy; {new Date().getFullYear()} Certificate Generator Admin</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
