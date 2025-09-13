import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const CreateEvent = () => {
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [mode, setMode] = useState('public');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!eventName.trim()) {
            setError('Event name is required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const docRef = await addDoc(collection(db, 'events'), {
                eventName,
                eventDescription,
                mode,
                createdAt: serverTimestamp(),
                certificateUrl: '' // Initialize as empty
            });
            navigate(`/admin/manage-event/${docRef.id}`);
        } catch (err) {
            setError('Failed to create event. Please try again.');
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center p-4" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="card shadow-lg border-0" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="card-body p-5">
                    <Link to="/admin/dashboard" className="btn btn-sm btn-outline-secondary mb-3">
                        <i className="bi bi-arrow-left"></i> Back
                    </Link>
                    <h2 className="h3 fw-bold text-center text-primary mb-4">Create New Event</h2>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="eventName" className="form-label">Event Name</label>
                            <input type="text" id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} className="form-control" required />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="eventDescription" className="form-label">Event Description</label>
                            <textarea id="eventDescription" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className="form-control" rows="3"></textarea>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="mode" className="form-label">Certificate Mode</label>
                            <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)} className="form-select">
                                <option value="public">Public - Anyone with the link can get a certificate</option>
                                <option value="manual">Manual - Only added participants can get a certificate</option>
                            </select>
                        </div>
                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Create Event and Continue'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
