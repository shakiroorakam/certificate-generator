import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import Modal from '../../components/Modal'; // Adjusted path

const AdminDashboard = ({ session }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalMessage, setModalMessage] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            if (!session) return; // Don't fetch if no session
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('id, eventName, mode, created_at') // Select only needed fields
                    .eq('user_id', session.user.id) // Fetch only events created by this user
                    .order('created_at', { ascending: false });

                if (error) {
                    // Check if error is due to RLS before throwing
                    if (error.message.includes('security policy')) {
                         console.warn("RLS policy might be preventing event fetching. Ensure SELECT policy exists for authenticated users.");
                         setError("You might not have permission to view events. Check RLS policies.");
                    } else {
                        throw error;
                    }
                }
                setEvents(data || []); // Ensure events is always an array
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("Failed to fetch events. " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [session]); // Re-fetch if session changes

    const getModeLabel = (mode) => {
        return mode === 'manual' ? 'Manual (Registered Only)' : 'Public (Anyone)';
    };

    const copyShareableLink = (eventId) => {
        const shareableLink = `${window.location.origin}${window.location.pathname}#/event/${eventId}`;
        navigator.clipboard.writeText(shareableLink)
            .then(() => setModalMessage('Event link copied to clipboard!'))
            .catch(err => setError('Failed to copy link.'));
    };


    if (loading) {
        return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}><div className="spinner-border text-primary"></div></div>;
    }

    return (
        <div>
            {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
             {error && <div className="alert alert-danger" role="alert">{error}</div>}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0 fw-bold text-dark">Your Events</h2>
                <Link to="/admin/create-event" className="btn btn-primary">
                    <i className="bi bi-plus-circle-fill me-2"></i>Create New Event
                </Link>
            </div>

            {events.length === 0 && !loading && !error && (
                <div className="card text-center shadow-sm">
                    <div className="card-body p-5">
                        <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
                        <h5 className="card-title">No Events Found</h5>
                        <p className="card-text text-muted">You haven't created any events yet.</p>
                        <Link to="/admin/create-event" className="btn btn-primary mt-3">
                            Create Your First Event
                        </Link>
                    </div>
                </div>
            )}

            {events.length > 0 && (
                <div className="row g-4">
                    {events.map((event) => (
                        <div key={event.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title fw-bold text-primary">{event.eventName}</h5>
                                    <p className="card-text mb-2">
                                        <span className={`badge ${event.mode === 'manual' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                            {getModeLabel(event.mode)}
                                        </span>
                                    </p>
                                    <p className="card-text text-muted small mb-3">
                                        Created: {new Date(event.created_at).toLocaleDateString()}
                                    </p>
                                    <div className="mt-auto d-flex justify-content-between align-items-center">
                                        <Link to={`/admin/manage-event/${event.id}`} className="btn btn-outline-primary btn-sm">
                                            Manage Event
                                        </Link>
                                        <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => copyShareableLink(event.id)}
                                            title="Copy Shareable Link"
                                        >
                                            <i className="bi bi-clipboard-check"></i> Copy Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

