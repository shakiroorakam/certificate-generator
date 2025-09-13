import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

const AdminDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsCollection = collection(db, 'events');
                const q = query(eventsCollection, orderBy('createdAt', 'desc'));
                const eventSnapshot = await getDocs(q);
                const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEvents(eventList);
            } catch (error) {
                console.error("Error fetching events: ", error);
                alert('Could not fetch events.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('isAdminLoggedIn');
        navigate('/');
    };
    
    const getShareableLink = (eventId) => {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}#/event/${eventId}`;
    };

    return (
        <div className="min-vh-100 p-4" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h2 fw-bold text-primary">Admin Dashboard</h1>
                    <div>
                        <Link to="/admin/create-event" className="btn btn-primary me-2">
                            <i className="bi bi-plus-circle-fill me-2"></i>Create New Event
                        </Link>
                        <button onClick={handleLogout} className="btn btn-outline-danger">Logout</button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
                ) : events.length === 0 ? (
                    <div className="text-center p-5 bg-light rounded">
                        <h4>No events found.</h4>
                        <p>Click "Create New Event" to get started.</p>
                    </div>
                ) : (
                    <div className="row g-4">
                        {events.map(event => (
                            <div key={event.id} className="col-lg-4 col-md-6">
                                <div className="card h-100 shadow-sm border-0">
                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title text-primary">{event.eventName}</h5>
                                        <p className="card-text text-muted small flex-grow-1">{event.eventDescription}</p>
                                        <div className="mt-auto">
                                             <div className="input-group mb-3">
                                                <input type="text" className="form-control form-control-sm" value={getShareableLink(event.id)} readOnly />
                                                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigator.clipboard.writeText(getShareableLink(event.id))}>
                                                    <i className="bi bi-clipboard"></i>
                                                </button>
                                            </div>
                                            <Link to={`/admin/manage-event/${event.id}`} className="btn btn-secondary w-100">
                                                Manage Event
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
