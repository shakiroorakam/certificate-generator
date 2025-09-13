import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventsCollection = collection(db, 'events');
                const q = query(eventsCollection, orderBy('createdAt', 'desc'));
                const eventSnapshot = await getDocs(q);
                const eventsList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEvents(eventsList);
            } catch (err) {
                console.error("Error fetching events: ", err);
                setError('Failed to load events. Please try refreshing the page.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <div className="min-vh-100" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="container py-5">
                <div className="text-center mb-5">
                    <h1 className="fw-bold text-primary">Available Events</h1>
                    <p className="text-muted">Select an event below to get your certificate.</p>
                </div>

                {loading && <div className="text-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {!loading && !error && (
                    <div className="row g-4">
                        {events.length > 0 ? (
                            events.map(event => (
                                <div className="col-md-6 col-lg-4" key={event.id}>
                                    <div className="card h-100 shadow-sm border-0 hover-shadow">
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title fw-bold text-primary">{event.eventName}</h5>
                                            <p className="card-text text-muted flex-grow-1">{event.eventDescription || 'No description provided.'}</p>
                                            <Link to={`/event/${event.id}`} className="btn btn-primary mt-3">
                                                Get Certificate <i className="bi bi-arrow-right-short"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="card text-center p-5">
                                    <p className="text-muted mb-0">No events are available at the moment. Please check back later.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;