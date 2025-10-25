import React, { useState, useEffect } from 'react';
// Removed unused 'Navigate' import
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ManageEventLayout from '../../components/ManageEventLayout'; // Assuming the layout handles its own state now

// This component now mainly fetches data and passes it down
const ManageEvent = ({ session }) => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId || !session?.user) {
                setError("Event ID missing or user not logged in.");
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    // Optional: Add RLS check simulation if needed, but RLS should handle this
                    // .eq('user_id', session.user.id)
                    .single();

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Event not found or access denied.");

                setEvent(data);
                setError(''); // Clear previous errors on success

            } catch (err) {
                console.error("Error loading event:", err);
                setError("Failed to load event data. " + err.message);
                setEvent(null); // Clear event data on error
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, session]); // Refetch if eventId or session changes

    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading Event...</span>
                </div>
            </div>
        );
    }

    // Display error if loading finished and event is still null
    if (!event && error) {
        return (
             // Use AdminLayout structure even for errors if desired, or a simpler message
             <div className="vh-100 d-flex justify-content-center align-items-center p-4">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error Loading Event</h4>
                    <p>{error}</p>
                    <hr />
                    <Link to="/admin" className="btn btn-secondary">Back to Dashboard</Link>
                </div>
            </div>
        );
    }
    // If loading is done, no error, but event is somehow still null (edge case)
    if (!event) {
         return (
             <div className="vh-100 d-flex justify-content-center align-items-center">
                 <p className="text-muted">Event data could not be loaded.</p>
                 <Link to="/admin" className="ms-3">Back to Dashboard</Link>
             </div>
        );
    }


    // Pass the fetched event data and session to the layout component
    return (
        <ManageEventLayout
            event={event}
            session={session}
            eventId={eventId}
        />
    );
};

export default ManageEvent;