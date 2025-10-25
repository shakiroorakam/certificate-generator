import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Adjusted path
import ManageEventLayout from '../../components/ManageEventLayout'; // Import the new layout

// This component now primarily fetches data and passes it to the layout component.
const ManageEvent = ({ session }) => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!session || !eventId) {
                setLoading(false);
                setError("Missing session or event ID.");
                return;
            }

            setLoading(true);
            try {
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .eq('user_id', session.user.id) // Ensure the user owns this event
                    .single();

                if (eventError) {
                    if (eventError.code === 'PGRST116') { // PostgREST code for "No rows found"
                        setError("Event not found or you don't have permission to access it.");
                    } else {
                        throw eventError;
                    }
                } else if (eventData) {
                    setEvent(eventData);
                } else {
                     setError("Event not found or you don't have permission to access it.");
                }

            } catch (err) {
                console.error("Error loading event:", err);
                setError("Failed to load event data. " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, session]); // Re-fetch if eventId or session changes

    if (loading) {
        return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;
    }

    if (error) {
        return (
            <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
                <p className="alert alert-danger">{error}</p>
                <a href="/#/admin" className="btn btn-secondary">Back to Dashboard</a>
            </div>
        );
    }

    // Render the layout component, passing the fetched event data and session
    return (
         <ManageEventLayout event={event} session={session} eventId={eventId} />
    );
};

export default ManageEvent;

