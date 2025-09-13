import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, you'd use a more secure authentication method.
        if (password === 'admin123') {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            navigate('/admin/dashboard');
        } else {
            setError('Incorrect password.');
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4" style={{ backgroundColor: '#343a40' }}>
            <div className="card shadow-lg border-0 rounded-3" style={{ maxWidth: '480px', width: '100%' }}>
                <div className="card-body text-center p-5">
                    <h1 className="fw-bold text-primary mb-3">Admin Login</h1>
                    <p className="text-muted mb-4">Please enter the admin password to continue.</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-floating mb-3">
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="password">Password</label>
                        </div>
                        {error && <p className="text-danger small">{error}</p>}
                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary btn-lg rounded-pill">
                                Login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
