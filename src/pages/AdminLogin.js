import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; 

const AdminLogin = () => {
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use the actual admin email you created in Supabase
            const adminEmail = "shakirokm@gmail.com"; 

            const { error } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: password,
            });

            if (error) throw error;
            
            // Login successful! App.js will handle the redirect.

        } catch (error) {
            console.error('Error logging in:', error);
            let errorMessage = 'An error occurred. Please try again.';
            if (error.message.includes("Invalid login credentials")) {
                // More specific error for Supabase
                errorMessage = "Invalid email or password. Please try again."; 
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center p-4" style={{ backgroundColor: '#343a40' }}>
            <div className="card shadow-lg border-0 rounded-3" style={{ maxWidth: '480px', width: '100%' }}>
                <div className="card-body text-center p-5">
                    <h1 className="fw-bold text-primary mb-3">Admin Login</h1>
                    <p className="text-muted mb-4">
                        Please enter the admin password to manage events.
                    </p>
                    
                    {error && <div className="alert alert-danger">{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-floating mb-3">
                            <input 
                                type="password" 
                                className="form-control" 
                                id="adminPassword" 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <label htmlFor="adminPassword">Password</label>
                        </div>

                        <div className="d-grid gap-3">
                            <button 
                                type="submit"
                                className="btn btn-primary btn-lg rounded-pill"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Logging In...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
