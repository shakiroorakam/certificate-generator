import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import Modal from '../../components/Modal'; // Adjusted path

const AdminDashboard = ({ session }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true); // Ensure loading is true when fetching starts
            setError(''); // Clear previous errors
            try {
                // Fetch events created by the logged-in user
                const { data, error: fetchError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('user_id', session.user.id) // Filter by logged-in user
                    .order('created_at', { ascending: false });

                if (fetchError) {
                    // Check if the error is RLS related or other DB issue
                     if (fetchError.message.includes("security policy")) {
                        setError("Could not fetch events due to security policy. Please check Supabase RLS settings.");
                    } else {
                        throw fetchError; // Rethrow other errors
                    }
                } else {
                    setEvents(data || []); // Ensure events is an array even if data is null/undefined
                }

            } catch (err) {
                console.error("Error fetching events:", err);
                setError("Failed to load events. " + err.message);
                setEvents([]); // Clear events on error
            } finally {
                setLoading(false); // Set loading false after fetch attempt
            }
        };

        if (session) {
            fetchEvents();
        } else {
             setError("Not logged in."); // Should ideally be handled by router, but good fallback
             setLoading(false);
        }

    }, [session]); // Re-fetch if session changes

    const handleSignOut = async () => {
        setLoading(true);
        const { error: signOutError } = await supabase.auth.signOut();
        setLoading(false);
        if (signOutError) {
            setError("Failed to sign out: " + signOutError.message);
        } else {
             // App.js listener will handle redirecting to login
             // No need to navigate here if App.js handles it based on session change
        }
    };

    return (
        <div>
            {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0 text-primary fw-bold">My Events</h1>
                <Link to="/admin/create-event" className="btn btn-primary">
                    <i className="bi bi-plus-circle-fill me-2"></i>Create New Event
                </Link>
            </div>

            {/* Display Loading State */}
            {loading && (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading events...</span>
                    </div>
                    <p className="mt-2">Loading events...</p>
                </div>
            )}

             {/* Display Error Message if fetch failed */}
            {!loading && error && (
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error</h4>
                    <p>{error}</p>
                    <hr />
                    <p className="mb-0">Please check your connection and Supabase RLS policies, then refresh the page.</p>
                 </div>
            )}

            {/* Display Event Cards or No Events Message */}
            {!loading && !error && (
                <>
                    {events.length === 0 ? (
                        <div className="card shadow-sm border-0 text-center">
                             <div className="card-body p-5">
                                 <i className="bi bi-calendar-x fs-1 text-muted"></i>
                                <h5 className="card-title mt-3">No Events Found</h5>
                                <p className="card-text text-muted">You haven't created any events yet.</p>
                                <Link to="/admin/create-event" className="btn btn-success mt-2">
                                    Create Your First Event
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                            {events.map((event) => (
                                <div key={event.id} className="col">
                                    <div className="card h-100 shadow-sm border-0">
                                         {/* Optional: Add image if you store one for the event */}
                                        {/* <img src="..." className="card-img-top" alt="..."> */}
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title text-primary">{event.eventName}</h5>
                                            <p className="card-text text-muted small flex-grow-1">
                                                {event.eventDescription ? (event.eventDescription.substring(0, 100) + (event.eventDescription.length > 100 ? '...' : '')) : <i>No description</i>}
                                            </p>
                                            <div className="mt-3 d-flex justify-content-between align-items-center">
                                                <span className={`badge ${event.mode === 'public' ? 'bg-success' : 'bg-info'}`}>
                                                    {event.mode === 'public' ? 'Public' : 'Manual'}
                                                </span>
                                                <Link to={`/admin/manage-event/${event.id}`} className="btn btn-outline-primary btn-sm">
                                                    Manage <i className="bi bi-arrow-right-short"></i>
                                                </Link>
                                            </div>
                                        </div>
                                         <div className="card-footer bg-light border-0 text-muted small">
                                             Created: {new Date(event.created_at).toLocaleDateString()}
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

             {/* Sign Out Button - Moved lower for clarity, styling might need adjustment */}
            {/* <div className="mt-5">
                 <button onClick={handleSignOut} className="btn btn-outline-danger" disabled={loading}>
                     {loading ? 'Signing out...' : 'Sign Out'}
                 </button>
             </div> */}
        </div>
    );
};

export default AdminDashboard;
