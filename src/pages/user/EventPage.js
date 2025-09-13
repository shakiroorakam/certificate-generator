import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import jsPDF from 'jspdf'; // Import the new library

const EventPage = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [certificateName, setCertificateName] = useState('');
    const [userInput, setUserInput] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, 'events', eventId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const eventData = { id: docSnap.id, ...docSnap.data() };
                    setEvent(eventData);
                    if (eventData.mode === 'public') {
                        setIsVerified(true);
                    }
                } else {
                    setError('Event not found. Please check the link.');
                }
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        setLoading(true);
        setError('');

        if (event.mode === 'public') {
            setCertificateName(userInput);
        } else { 
            const participantsRef = collection(db, 'events', eventId, 'participants');
            const q = query(participantsRef, where("mobile", "==", userInput.trim()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const participantData = querySnapshot.docs[0].data();
                setCertificateName(participantData.name);
                setIsVerified(true);
            } else {
                setError('This mobile number is not registered for this event.');
                setIsVerified(false);
            }
        }
        setLoading(false);
    };

    if (loading && !event) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;
    
    if (error && !isVerified) return <div className="vh-100 d-flex justify-content-center align-items-center"><p className="alert alert-danger">{error}</p></div>;

    const renderInputForm = () => (
        <div>
            <h2 className="h3 fw-bold text-center text-primary mb-2">{event?.eventName}</h2>
            <p className="text-center text-muted mb-4">{event?.eventDescription}</p>
            <hr />
            <form onSubmit={handleSubmit}>
                {event.mode === 'manual' ? (
                     <div className="mb-3">
                        <label htmlFor="mobile" className="form-label">Enter your registered mobile number:</label>
                        <input type="tel" id="mobile" value={userInput} onChange={(e) => setUserInput(e.target.value)} className="form-control" required />
                    </div>
                ) : (
                    <div className="mb-3">
                        <label htmlFor="userName" className="form-label">Enter your name for the certificate:</label>
                        <input type="text" id="userName" value={userInput} onChange={(e) => setUserInput(e.target.value)} className="form-control" required />
                    </div>
                )}
                <div className="d-grid">
                    <button type="submit" className="btn btn-success" disabled={loading}>
                        {loading ? 'Verifying...' : 'Generate Certificate'}
                    </button>
                </div>
            </form>
        </div>
    );


    return (
        <div className="min-vh-100 d-flex justify-content-center align-items-center p-4" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="card shadow-lg border-0" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="card-body p-5">
                    {isVerified && certificateName ? (
                        <CertificateGenerator event={event} userName={certificateName} />
                    ) : (
                        renderInputForm()
                    )}
                </div>
            </div>
        </div>
    );
};

const CertificateGenerator = ({ event, userName }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const fontSize = event.fontSize || 60;
    const positionX = event.positionX || 50;
    const positionY = event.positionY || 50;
    const fontWeight = event.fontWeight || 'bold';
    const fontFamily = event.fontFamily || 'Poppins'; // Get font family

    const handleDownload = async () => {
        if (!event.certificateUrl) {
            alert("Certificate template is not available for this event.");
            return;
        }
        setIsDownloading(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const template = await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("Could not load certificate image."));
                img.src = event.certificateUrl;
            });

            canvas.width = template.width;
            canvas.height = template.height;
            ctx.drawImage(template, 0, 0);

            // Use dynamic values from the event, including font family
            ctx.fillStyle = '#333333';
            ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const x = (canvas.width * positionX) / 100;
            const y = (canvas.height * positionY) / 100;
            ctx.fillText(userName, x, y);

            // --- PDF Generation Logic ---
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: template.width > template.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [template.width, template.height]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, template.width, template.height);
            pdf.save(`certificate-${userName.replace(/\s+/g, '-')}.pdf`);
            // --- End of PDF Logic ---

        } catch (error) {
            console.error("Failed to generate certificate:", error);
            alert("An error occurred while creating your certificate.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="text-center">
            <h2 className="h3 fw-bold text-success mb-3">Congratulations, {userName}!</h2>
            <p className="text-muted mb-4">Your certificate for "{event.eventName}" is ready.</p>
            
            <div className="position-relative mb-4">
                 <img src={event.certificateUrl} alt="Certificate" className="img-fluid border rounded shadow-sm" />
                 <p 
                    className="position-absolute" 
                    style={{
                        top: `${positionY}%`, 
                        left: `${positionX}%`, 
                        transform: 'translate(-50%, -50%)',
                        color: '#333333',
                        fontSize: `${fontSize / 30}vw`,
                        fontWeight: fontWeight,
                        fontFamily: `'${fontFamily}', sans-serif`, // Apply font family to preview
                        padding: '0 10px',
                        width: '100%'
                    }}
                >
                    {userName}
                </p>
            </div>

            <div className="d-grid">
                <button onClick={handleDownload} className="btn btn-danger btn-lg" disabled={isDownloading}>
                    {isDownloading ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Preparing PDF...</>
                    ) : (
                        <><i className="bi bi-file-earmark-pdf-fill me-2"></i>Download Certificate (PDF)</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default EventPage;

