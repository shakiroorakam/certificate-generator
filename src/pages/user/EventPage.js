    import React, { useState, useEffect, useCallback } from 'react';
    import { useParams } from 'react-router-dom';
    import { supabase } from '../../supabaseClient';
    import jsPDF from 'jspdf';

    const EventPage = () => {
        const { eventId } = useParams();
        const [event, setEvent] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const [userName, setUserName] = useState('');
        const [participantName, setParticipantName] = useState(null); // Stores the validated name

        useEffect(() => {
            const fetchEvent = async () => {
                setLoading(true); // Start loading
                setError(''); // Clear previous errors
                try {
                    // Fetch event details from Supabase 'events' table
                    // Use maybeSingle() instead of single() for better error handling
                    const { data, error: fetchError } = await supabase
                        .from('events')
                        .select('*')
                        .eq('id', eventId)
                        .maybeSingle(); // <<< CHANGED HERE

                    // Handle potential errors after the query
                    if (fetchError) {
                         // Specific check for RLS-related "not found" which might have caused coerce error before
                         if (fetchError.code === 'PGRST116') { // Standard PostgREST code for "Not Found"
                             setError('Event not found or access denied. Please check the link and RLS policies.');
                         } else {
                            throw fetchError; // Rethrow other database errors
                         }
                    } else if (data) {
                        setEvent(data); // Set event data if found
                    } else {
                        // This case handles if maybeSingle() returns null (no record found)
                        setError('Event not found. Please check the link.');
                    }
                } catch (err) {
                    console.error("Error fetching event:", err);
                    // Provide a more generic error for unexpected issues
                    setError('Failed to load event details. ' + (err.message || 'Unknown error'));
                } finally {
                    setLoading(false); // Stop loading regardless of outcome
                }
            };
            fetchEvent();
        }, [eventId]);


        const handleAccessSubmit = async (e) => {
            e.preventDefault();
            if (!userName.trim() || !event) return; // Ensure event is loaded
            setLoading(true);
            setError('');

            if (event.mode === 'public') {
                setParticipantName(userName.trim()); // Use the name they entered
            } else {
                // Manual mode: check if user is in the participants list
                try {
                    const { data, error: participantError } = await supabase
                        .from('participants')
                        .select('name')
                        .eq('event_id', eventId)
                        .eq('mobile', userName.trim()) // Using 'userName' state for mobile number
                        .maybeSingle(); // Use maybeSingle here too for safety

                    if (participantError) {
                        // Check for "Not Found" specifically
                        if (participantError.code === 'PGRST116') {
                            setError('You are not registered for this event. Please check the mobile number you entered.');
                        } else {
                            throw participantError; // Rethrow other errors
                        }
                    } else if (data) {
                        setParticipantName(data.name); // Set the validated name
                    } else {
                         // Handle case where maybeSingle returns null
                        setError('You are not registered for this event. Please check the mobile number you entered.');
                    }
                } catch (err) {
                    console.error("Error validating participant:", err);
                     // Provide a clearer error message
                    setError('Could not verify participant. Please check the mobile number and try again.');
                }
            }
            setLoading(false);
        };

        // Improved loading/error display
        if (loading) {
            return (
                <div className="vh-100 d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            );
        }

        // Show error prominently if loading is done and there's an error (and not yet validated)
        if (error && !participantName) {
            return (
                <div className="min-vh-100 d-flex justify-content-center align-items-center p-4" style={{ backgroundColor: '#f0f2f5' }}>
                     <div className="card shadow-lg border-0" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="card-body p-5 text-center">
                            <h2 className="h4 text-danger">Error Loading Event</h2>
                            <p className="text-muted">{error}</p>
                            {/* Optionally add a back button or refresh */}
                        </div>
                    </div>
                </div>
            );
        }

        // If loading is done, no error, but event is still null (edge case)
        if (!event && !loading) {
             return (
                 <div className="min-vh-100 d-flex justify-content-center align-items-center p-4" style={{ backgroundColor: '#f0f2f5' }}>
                     <div className="card shadow-lg border-0" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="card-body p-5 text-center">
                            <h2 className="h4 text-warning">Event Not Found</h2>
                            <p className="text-muted">The event details could not be loaded. Please ensure the link is correct.</p>
                        </div>
                    </div>
                 </div>
            );
        }


        // Main render logic
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center p-4" style={{ backgroundColor: '#f0f2f5' }}>
                <div className="card shadow-lg border-0" style={{ maxWidth: '600px', width: '100%' }}>
                    <div className="card-body p-5">
                        {participantName ? (
                            <CertificateGenerator event={event} userName={participantName} />
                        ) : (
                            <div>
                                <h2 className="h3 fw-bold text-center text-primary mb-2">{event?.eventName}</h2>
                                <p className="text-center text-muted mb-4">{event?.eventDescription}</p>
                                <hr />
                                <h3 className="h5 text-center my-4">Get Your Certificate</h3>
                                {error && <p className="alert alert-danger text-center small">{error}</p>} {/* Show validation error inline */}
                                <form onSubmit={handleAccessSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="userName" className="form-label">
                                            {event?.mode === 'manual' ?
                                            'Enter your registered Mobile Number' :
                                            'Enter your name as you want it on the certificate'}
                                        </label>
                                        <input
                                            type={event?.mode === 'manual' ? 'tel' : 'text'}
                                            id="userName"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="form-control"
                                            placeholder={event?.mode === 'manual' ? '10-digit mobile number' : 'Your Full Name'}
                                            required
                                        />
                                    </div>
                                    <div className="d-grid">
                                        <button type="submit" className="btn btn-success" disabled={loading}>
                                            {loading ? 'Verifying...' : 'Get Certificate'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- CertificateGenerator (No changes needed in this part) ---
    const CertificateGenerator = ({ event, userName }) => {
        const [isDownloading, setIsDownloading] = useState(false);
        const [previewUrl, setPreviewUrl] = useState(null);
        const [isLoadingPreview, setIsLoadingPreview] = useState(true);

        // Reusable function to create the certificate on a canvas
        const generateCanvas = useCallback(() => {
            return new Promise(async (resolve, reject) => {
                try {
                    if (!event.certificateUrl) {
                        return reject(new Error("Certificate template is not available."));
                    }

                    // 1. Create a canvas element in memory
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 2. Load the certificate template image
                    const template = await new Promise((resolveImg, rejectImg) => {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => resolveImg(img);
                        img.onerror = (err) => rejectImg(new Error("Could not load certificate image. Check CORS/URL."));
                        img.src = event.certificateUrl;
                    });

                    // 3. Set canvas size to match the image and draw it
                    canvas.width = template.naturalWidth; // Use naturalWidth/Height for accurate size
                    canvas.height = template.naturalHeight;
                    ctx.drawImage(template, 0, 0);

                    // 4. Load the font
                    const font = `${event.fontWeight || 'bold'} ${event.fontSize || 60}px "${event.fontFamily || 'Poppins'}"`;
                    try {
                        // Important: Ensure font is loaded before drawing
                        await document.fonts.load(font);
                    } catch (err) {
                        console.warn(`Could not load font: ${event.fontFamily}. Using fallback.`);
                    }

                    // 5. Set font and draw the user's name
                    ctx.fillStyle = '#333333';
                    ctx.font = font;
                    ctx.textAlign = 'left'; // Use left alignment
                    ctx.textBaseline = 'middle';

                    // Calculate position based on admin settings
                    const x = (canvas.width * (event.positionX || 50)) / 100;
                    const y = (canvas.height * (event.positionY || 50)) / 100;

                    ctx.fillText(userName, x, y);

                    resolve(canvas);

                } catch (error) {
                    console.error("Failed to generate canvas:", error);
                    reject(error);
                }
            });
        }, [event, userName]); // Dependencies for the canvas generation


        // This effect generates the preview image for the <img> tag
        useEffect(() => {
            setIsLoadingPreview(true);
            generateCanvas().then(canvas => {
                setPreviewUrl(canvas.toDataURL('image/png'));
                setIsLoadingPreview(false);
            }).catch(err => {
                console.error("Failed to generate preview:", err);
                setIsLoadingPreview(false);
                 // Optionally set an error state for the preview
            });
        }, [generateCanvas]); // Dependency array includes the memoized function

        const handleDownload = async () => {
            setIsDownloading(true);
            try {
                const canvas = await generateCanvas();

                // Create a new PDF document
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'l' : 'p',
                    unit: 'pt',
                    format: [canvas.width, canvas.height]
                });

                // Add the canvas image to the PDF
                pdf.addImage(
                    canvas.toDataURL('image/png'),
                    'PNG',
                    0, 0,
                    canvas.width, canvas.height,
                    undefined, // alias
                    'FAST' // compression
                );

                // Trigger the download
                pdf.save(`certificate-${userName.replace(/\s+/g, '-')}.pdf`);

            } catch (error) {
                console.error("Failed to generate certificate PDF:", error);
                alert("An error occurred while creating your certificate PDF. Please try again.");
            } finally {
                setIsDownloading(false);
            }
        };

        return (
            <div className="text-center">
                <h2 className="h3 fw-bold text-success mb-3">Congratulations, {userName}!</h2>
                <p className="text-muted mb-4">Your certificate for "{event.eventName}" is ready.</p>

                {/* The visual preview for the user */}
                <div className="position-relative mb-4 border rounded shadow-sm" style={{minHeight: '200px', background: '#eee'}}>
                    {isLoadingPreview ? (
                        <div className="d-flex justify-content-center align-items-center" style={{height: '200px'}}>
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading Preview...</span>
                            </div>
                        </div>
                    ) : previewUrl ? ( // Only show image if previewUrl is available
                        <img src={previewUrl} alt="Certificate Preview" className="img-fluid" style={{ display: 'block' }}/>
                    ) : (
                         <div className="d-flex justify-content-center align-items-center" style={{height: '200px'}}>
                             <p className="text-danger">Could not load preview.</p>
                         </div>
                    )}
                </div>

                <div className="d-grid">
                    <button onClick={handleDownload} className="btn btn-primary btn-lg" disabled={isDownloading || isLoadingPreview || !previewUrl}>
                        {isDownloading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Preparing PDF...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-download me-2"></i>Download PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    export default EventPage;

    
