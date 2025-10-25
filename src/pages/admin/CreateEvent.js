import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // <--- UPDATED PATH
import Modal from '../../components/Modal';

// This component now receives the 'session' object as a prop
const CreateEvent = ({ session }) => {
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [mode, setMode] = useState('public');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!eventName.trim() || !eventDescription.trim()) {
            setError('Event name and description are required.');
            setLoading(false);
            return;
        }

        // Check for an active session before proceeding
        if (!session || !session.user) {
            setError('You must be logged in to create an event.');
            setLoading(false);
            return;
        }

        try {
            // Insert the new event into the 'events' table
            const { data, error } = await supabase
                .from('events')
                .insert([
                    {
                        eventName,
                        eventDescription,
                        mode,
                        user_id: session.user.id, // Associate the event with the logged-in user
                    },
                ])
                .select() // Ask Supabase to return the newly created row
                .single(); // We only expect one row to be returned

            if (error) throw error;

            if (data) {
                // Show success message
                setModalMessage('Event created successfully! Redirecting to event manager...');
                
                // Redirect to the new ManageEvent page for the created event
                setTimeout(() => {
                    navigate(`/admin/manage-event/${data.id}`);
                }, 2000);
            }

        } catch (error) {
            console.error('Error creating event:', error);
            setError(`Error creating event: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f0f2f5' }}>
            {/* Header */}
            <header className="bg-white shadow-sm p-3">
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <h1 className="h4 text-primary fw-bold mb-0">Create New Event</h1>
                    <Link to="/admin" className="btn btn-outline-secondary">
                        <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-fluid p-4 flex-grow-1">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card shadow-lg border-0">
                            <div className="card-body p-5">
                                <h2 className="h5 card-title fw-bold mb-4">Event Details</h2>
                                
                                {error && <div className="alert alert-danger">{error}</div>}
                                
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="eventName" className="form-label">Event Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="eventName"
                                            value={eventName}
                                            onChange={(e) => setEventName(e.target.value)}
                                            placeholder="e.g., Annual Tech Summit 2025"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="eventDescription" className="form-label">Event Description</label>
                                        <textarea
                                            className="form-control"
                                            id="eventDescription"
                                            rows="3"
                                            value={eventDescription}
                                            onChange={(e) => setEventDescription(e.target.value)}
                                            placeholder="A brief description of the event."
                                            required
                                        ></textarea>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label">Certificate Mode</label>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="eventMode"
                                                id="modePublic"
                                                value="public"
                                                checked={mode === 'public'}
                                                onChange={(e) => setMode(e.target.value)}
                                            />
                                            <label className="form-check-label" htmlFor="modePublic">
                                                <strong>Public:</strong> Anyone with the link can enter their name and get a certificate.
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="eventMode"
                                                id="modeManual"
                                                value="manual"
                                                checked={mode === 'manual'}
                                                onChange={(e) => setMode(e.target.value)}
                                            />
                                            <label className="form-check-label" htmlFor="modeManual">
                                                <strong>Manual:</strong> Only pre-registered participants (added by you) can get a certificate.
                                            </label>
                                        </div>
                                    </div>
                                    <div className="d-grid">
                                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Creating Event...
                                                </>
                                            ) : (
                                                'Create Event & Continue'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
        </div>
    );
};

export default CreateEvent;

