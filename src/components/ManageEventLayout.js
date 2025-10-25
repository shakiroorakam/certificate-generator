import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import * as XLSX from 'xlsx';

// This layout component manages the sidebar and content for a single event
const ManageEventLayout = ({ event: initialEvent, session, eventId }) => {
    const navigate = useNavigate();
    const [event, setEvent] = useState(initialEvent);
    const [loading, setLoading] = useState(false); // General loading state for saving
    const [error, setError] = useState('');
    const [modalMessage, setModalMessage] = useState('');
    const [activeSection, setActiveSection] = useState('certificate'); // Default section

    // State for General Settings section
    const [eventName, setEventName] = useState(initialEvent?.eventName || '');
    const [eventDescription, setEventDescription] = useState(initialEvent?.eventDescription || '');
    const [mode, setMode] = useState(initialEvent?.mode || 'public');

    // State for Certificate section
    const [certificateFile, setCertificateFile] = useState(null);
    const [certificateUrl, setCertificateUrl] = useState(initialEvent?.certificateUrl || '');
    const [uploading, setUploading] = useState(false);
    const [fontSize, setFontSize] = useState(initialEvent?.fontSize || 60);
    const [positionX, setPositionX] = useState(initialEvent?.positionX || 50);
    const [positionY, setPositionY] = useState(initialEvent?.positionY || 50);
    const [fontWeight, setFontWeight] = useState(initialEvent?.fontWeight || 'bold');
    const [fontFamily, setFontFamily] = useState(initialEvent?.fontFamily || 'Poppins');
    const previewCanvasRef = useRef(null);
    const [templateImage, setTemplateImage] = useState(null); // Store the loaded image object

    // State for Participants section
    const [participants, setParticipants] = useState([]);
    const [fetchingParticipants, setFetchingParticipants] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [newParticipantMobile, setNewParticipantMobile] = useState('');
    const [editingParticipant, setEditingParticipant] = useState(null);

    const availableFonts = [
        'Poppins',
        'Montserrat',
        'Times New Roman',
        'Playfair Display',
        'Raleway'
    ];

    // --- Data Fetching (Participants) ---
    const fetchParticipants = useCallback(async () => {
        if (event?.mode !== 'manual') return;
        setFetchingParticipants(true);
        try {
            const { data, error } = await supabase
                .from('participants')
                .select('*')
                .eq('event_id', eventId)
                .order('name', { ascending: true });

            if (error) throw error;
            setParticipants(data);
        } catch (err) {
            console.error("Error fetching participants:", err);
            setError("Failed to load participants. " + err.message);
        } finally {
            setFetchingParticipants(false);
        }
    }, [eventId, event?.mode]);

    useEffect(() => {
        if (event?.mode === 'manual') {
            fetchParticipants();
        } else {
            setParticipants([]);
        }
    }, [event?.mode, fetchParticipants]);

    // --- Certificate Preview Logic ---
    // Load the template image whenever the URL changes
    useEffect(() => {
        if (certificateUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = certificateUrl;
            img.onload = () => setTemplateImage(img);
            img.onerror = () => {
                console.error("Failed to load certificate template image.");
                setError("Could not load certificate preview image. Check URL or CORS settings.");
                setTemplateImage(null); // Clear image on error
            };
        } else {
            setTemplateImage(null); // Clear image if no URL
        }
    }, [certificateUrl]);

    // Redraw the canvas whenever the image or settings change
    useEffect(() => {
        const drawCanvas = async () => {
            if (templateImage && previewCanvasRef.current) {
                const canvas = previewCanvasRef.current;
                const ctx = canvas.getContext('2d');

                // Set canvas size to match the loaded image
                canvas.width = templateImage.naturalWidth;
                canvas.height = templateImage.naturalHeight;

                // Draw the template image first
                ctx.drawImage(templateImage, 0, 0);

                // Prepare font string
                const font = `${fontWeight} ${fontSize}px "${fontFamily}"`;

                // Try to load the font (best effort)
                try {
                    await document.fonts.load(font);
                } catch (err) {
                    console.warn(`Could not load font: ${fontFamily}. Using fallback.`);
                }

                // Draw the sample name
                ctx.fillStyle = '#333333';
                ctx.font = font;
                ctx.textAlign = 'left'; // <<< CHANGED HERE
                ctx.textBaseline = 'middle';

                // Calculate pixel coordinates from percentages
                const x = (canvas.width * positionX) / 100;
                const y = (canvas.height * positionY) / 100;

                ctx.fillText("Sample Participant Name", x, y);
            } else if (previewCanvasRef.current) {
                 // Clear canvas if no template image
                 const canvas = previewCanvasRef.current;
                 const ctx = canvas.getContext('2d');
                 // Set a default small size or keep previous if desired
                 // canvas.width = 300; canvas.height = 150;
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };

        drawCanvas();
    }, [templateImage, fontSize, positionX, positionY, fontWeight, fontFamily]); // Dependencies for redrawing


    // --- Save Handlers ---
    const handleSettingsSave = async () => {
        setLoading(true);
        setError('');
        try {
            const updates = {
                eventName,
                eventDescription,
                mode,
                fontSize: parseInt(fontSize, 10),
                positionX: parseFloat(positionX),
                positionY: parseFloat(positionY),
                fontWeight,
                fontFamily,
            };

            const { error: updateError } = await supabase
                .from('events')
                .update(updates)
                .eq('id', eventId)
                .eq('user_id', session.user.id);

            if (updateError) throw updateError;

            setEvent({ ...event, ...updates });
            setModalMessage('Event details updated successfully!');

            if (event.mode !== 'manual' && mode === 'manual') {
                fetchParticipants();
            } else if (mode === 'public') {
                setParticipants([]);
            }

        } catch (err) {
            console.error("Error updating settings:", err);
            setError("Failed to save settings. " + (err.message || err));
        } finally {
            setLoading(false);
        }
    };

    const handleCertificateUpload = async () => {
        if (!certificateFile) {
            setError('Please select a certificate template file to upload.');
            return;
        }
        setUploading(true);
        setError('');

        try {
            const fileName = `${Date.now()}_${certificateFile.name}`;
            const filePath = `certificates/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-files')
                .upload(filePath, certificateFile, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('event-files')
                .getPublicUrl(filePath);

            if (!urlData) throw new Error("Could not get public URL.");
            const newUrl = urlData.publicUrl;

            const { error: dbError } = await supabase
                .from('events')
                .update({ certificateUrl: newUrl })
                .eq('id', eventId)
                .eq('user_id', session.user.id);

            if (dbError) throw dbError;

            setCertificateUrl(newUrl); // Update local state immediately for preview
            setEvent({...event, certificateUrl: newUrl });
            setModalMessage('Certificate template uploaded successfully.');
            setCertificateFile(null);

        } catch (err) {
            console.error("Error uploading certificate:", err);
            setError("Failed to upload certificate. " + (err.message || err));
        } finally {
            setUploading(false);
        }
    };

    // --- Participant Logic (No changes needed here) ---
    const handleAddParticipant = async (e) => {
        e.preventDefault();
        if (!newParticipantName.trim() || !newParticipantMobile.trim()) {
            setError('Name and mobile are required.');
            return;
        }
        setError('');

        try {
            const { data, error } = await supabase
                .from('participants')
                .insert({
                    name: newParticipantName.trim(),
                    mobile: newParticipantMobile.trim(),
                    event_id: eventId
                })
                .select()
                .single();

            if (error) throw error;
            setParticipants([...participants, data].sort((a,b)=>a.name.localeCompare(b.name)));
            setNewParticipantName('');
            setNewParticipantMobile('');
        } catch (err) {
            console.error("Error adding participant:", err);
            setError("Failed to add participant. " + (err.message || err));
        }
    };

    const handleEditParticipant = (participant) => {
        setEditingParticipant({ ...participant });
    };

    const handleUpdateParticipant = async () => {
        if (!editingParticipant || !editingParticipant.name.trim() || !editingParticipant.mobile.trim()) {
            setError('Name and mobile are required.');
            return;
        }
         setError('');

        try {
            const { data, error } = await supabase
                .from('participants')
                .update({
                    name: editingParticipant.name.trim(),
                    mobile: editingParticipant.mobile.trim()
                })
                .eq('id', editingParticipant.id)
                .eq('event_id', eventId)
                .select()
                .single();

            if (error) throw error;

            setParticipants(
                 participants.map(p => p.id === data.id ? data : p)
                 .sort((a,b)=>a.name.localeCompare(b.name))
            );
            setEditingParticipant(null);

        } catch (err) {
            console.error("Error updating participant:", err);
            setError("Failed to update participant. " + (err.message || err));
        }
    };

    const handleDeleteParticipant = async (participantId) => {
        if (!window.confirm("Are you sure you want to delete this participant?")) return;
         setError('');

        try {
            const { error } = await supabase
                .from('participants')
                .delete()
                .eq('id', participantId)
                .eq('event_id', eventId);

            if (error) throw error;
            setParticipants(participants.filter(p => p.id !== participantId));
        } catch (err) {
            console.error("Error deleting participant:", err);
            setError("Failed to delete participant. " + (err.message || err));
        }
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setError('');

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                const headerRow = data[0] || [];
                const nameIndex = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === 'name');
                const mobileIndex = headerRow.findIndex(h => h && String(h).trim().toLowerCase() === 'mobile');

                if (nameIndex === -1 || mobileIndex === -1) {
                    setError("Excel file must contain columns named 'Name' and 'Mobile'.");
                    return;
                }

                const newParticipants = data
                    .slice(1)
                    .map(row => ({
                        name: row[nameIndex] ? String(row[nameIndex]).trim() : null,
                        mobile: row[mobileIndex] ? String(row[mobileIndex]).trim() : null,
                        event_id: eventId
                    }))
                    .filter(p => p.name && p.mobile);

                if (newParticipants.length === 0) {
                    setError("No valid participants found in the Excel file.");
                    return;
                }

                const { error } = await supabase
                    .from('participants')
                    .insert(newParticipants);

                if (error) throw error;

                setModalMessage(`Successfully imported ${newParticipants.length} participants.`);
                fetchParticipants();

            } catch (err) {
                console.error("Error importing from Excel:", err);
                setError("Failed to import participants. Check file format and column names ('Name', 'Mobile'). " + (err.message || err));
            } finally {
                 e.target.value = null;
            }
        };
        reader.onerror = (error) => {
             console.error("Error reading file:", error);
             setError("Failed to read the Excel file.");
        };
        reader.readAsBinaryString(file);
    };

    // --- Delete Event Logic (No changes needed here) ---
    const handleDeleteEvent = async () => {
        if (!window.confirm("Are you sure you want to delete this event?\nThis will also delete all associated participants. This action cannot be undone.")) {
            return;
        }
        setError('');
        setLoading(true);

        try {
            if (event?.certificateUrl) {
                try {
                    const url = new URL(event.certificateUrl);
                    const pathParts = url.pathname.split(`/event-files/`);
                    if (pathParts.length > 1) {
                        const filePath = decodeURIComponent(pathParts[1]);
                        console.log("Attempting to delete storage file:", filePath);
                        const { error: storageError } = await supabase.storage.from('event-files').remove([filePath]);
                        if (storageError) {
                            console.warn("Could not delete certificate file from storage:", storageError.message);
                        }
                    } else {
                        console.warn("Could not parse file path for deletion from URL:", event.certificateUrl);
                    }
                } catch (urlError) {
                    console.error("Error processing certificate URL for deletion:", urlError);
                }
            }

            const { error: dbError } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId)
                .eq('user_id', session.user.id);

            if (dbError) throw dbError;

            setModalMessage('Event deleted successfully. Redirecting to dashboard...');
            setTimeout(() => navigate('/admin'), 2000);

        } catch (err) {
            console.error("Error deleting event:", err);
            setError("Failed to delete event. " + (err.message || err));
            setLoading(false);
        }
    };


    // --- Render Logic ---
    const renderSection = () => {
        switch (activeSection) {
            case 'settings':
                return (
                    <div className="card shadow border-0">
                        {/* Settings content */}
                         <div className="card-body p-4 p-md-5">
                            <h3 className="h5 card-title fw-bold mb-4">General Settings</h3>
                            <div className="mb-3">
                                <label htmlFor="eventName" className="form-label">Event Name</label>
                                <input type="text" className="form-control" id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="eventDescription" className="form-label">Event Description</label>
                                <textarea className="form-control" id="eventDescription" rows="3" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="form-label">Certificate Mode</label>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="eventMode" id="modePublic" value="public" checked={mode === 'public'} onChange={(e) => setMode(e.target.value)} />
                                    <label className="form-check-label" htmlFor="modePublic"><strong>Public:</strong> Anyone can get a certificate.</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="eventMode" id="modeManual" value="manual" checked={mode === 'manual'} onChange={(e) => setMode(e.target.value)} />
                                    <label className="form-check-label" htmlFor="modeManual"><strong>Manual:</strong> Only pre-registered participants can get a certificate.</label>
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleSettingsSave} disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save General Settings'}
                            </button>
                        </div>
                    </div>
                );
            case 'certificate':
                return (
                    // NEW: Certificate section layout with fixed preview
                    <div className="certificate-section-layout">
                        {/* Scrollable Customization Column */}
                        <div className="certificate-controls">
                            <div className="card shadow border-0 h-100">
                                <div className="card-body p-4">
                                    <h3 className="h5 card-title fw-bold mb-4">Certificate Template</h3>
                                    <div className="mb-3">
                                        <label htmlFor="certificateFile" className="form-label">Upload New Template (JPG/PNG)</label>
                                        <input className="form-control" type="file" id="certificateFile" accept="image/png, image/jpeg, image/jpg" onChange={(e) => setCertificateFile(e.target.files[0])} />
                                    </div>
                                    <button className="btn btn-success mb-4" onClick={handleCertificateUpload} disabled={uploading || !certificateFile}>
                                        {uploading ? <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</> : 'Upload & Save Template'}
                                    </button>

                                    <hr className="my-4" />
                                    <h3 className="h5 card-title fw-bold mb-4">Text Customization</h3>

                                    <div className="mb-3">
                                        <label htmlFor="fontFamily" className="form-label">Font Family</label>
                                        <select id="fontFamily" className="form-select" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                                            {availableFonts.map(font => (
                                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="fontWeight" className="form-label">Font Weight</label>
                                        <select id="fontWeight" className="form-select" value={fontWeight} onChange={(e) => setFontWeight(e.target.value)}>
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="fontSize" className="form-label">Font Size: {fontSize}px</label>
                                        <input type="range" className="form-range" id="fontSize" min="10" max="200" step="1" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="positionX" className="form-label">Horizontal Position (X): {positionX}%</label>
                                        <input type="range" className="form-range" id="positionX" min="0" max="100" step="0.5" value={positionX} onChange={(e) => setPositionX(e.target.value)} />
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="positionY" className="form-label">Vertical Position (Y): {positionY}%</label>
                                        <input type="range" className="form-range" id="positionY" min="0" max="100" step="0.5" value={positionY} onChange={(e) => setPositionY(e.target.value)} />
                                    </div>
                                    <button className="btn btn-primary" onClick={handleSettingsSave} disabled={loading}>
                                        {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Customizations'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Fixed Preview Column */}
                        <div className="certificate-preview">
                            <div className="card shadow border-0 h-100 sticky-preview">
                                <div className="card-body p-4">
                                    <h3 className="h5 card-title fw-bold mb-4">Live Preview</h3>
                                    <div className="bg-light border rounded p-2 d-flex justify-content-center align-items-center preview-container">
                                        {certificateUrl ? (
                                             // Ensure canvas redraws correctly
                                            <canvas ref={previewCanvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}></canvas>
                                        ) : (
                                            <div className="text-center text-muted p-5">
                                                <i className="bi bi-image fs-1"></i>
                                                <p>Upload a template to see a preview.</p>
                                             </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'participants':
                 return (
                     <>
                        {mode === 'public' ? (
                            <div className="card shadow border-0">
                                <div className="card-body p-5 text-center">
                                    <h3 className="h5">Event is in Public Mode</h3>
                                    <p className="text-muted">In "Public" mode, anyone with the link can get a certificate by entering their name. To manage a specific list of participants, change the event mode to "Manual" in the Settings section.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="card shadow border-0">
                                <div className="card-body p-4 p-md-5">
                                    <h3 className="h5 card-title fw-bold mb-4">Manage Participants ({participants.length})</h3>

                                    {/* Add Single Participant */}
                                    <form onSubmit={handleAddParticipant} className="row g-3 mb-4 p-3 bg-light border rounded">
                                        <div className="col-md-5">
                                            <label htmlFor="newPName" className="form-label visually-hidden">Name</label>
                                            <input type="text" className="form-control" id="newPName" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} placeholder="Participant Name" required/>
                                        </div>
                                        <div className="col-md-5">
                                            <label htmlFor="newPMobile" className="form-label visually-hidden">Mobile</label>
                                            <input type="tel" className="form-control" id="newPMobile" value={newParticipantMobile} onChange={(e) => setNewParticipantMobile(e.target.value)} placeholder="Mobile Number" required/>
                                        </div>
                                        <div className="col-md-2 d-flex align-items-end">
                                            <button type="submit" className="btn btn-success w-100"><i className="bi bi-plus-lg me-1"></i> Add</button>
                                        </div>
                                    </form>

                                    {/* Upload Excel */}
                                    <div className="mb-4">
                                        <label htmlFor="excelUpload" className="form-label">Or Upload Excel File (.xlsx)</label>
                                        <input className="form-control" type="file" id="excelUpload" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                                        <div className="form-text">File must have columns named 'Name' and 'Mobile'.</div>
                                    </div>

                                    <hr />

                                    {/* Participant List */}
                                    <h4 className="h6 fw-bold mt-4">Registered List</h4>
                                    {fetchingParticipants ? (
                                        <div className="text-center p-5"><div className="spinner-border text-secondary"></div></div>
                                    ) : participants.length === 0 ? (
                                        <p className="text-muted text-center">No participants added yet.</p>
                                    ) : (
                                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                            <table className="table table-striped table-hover align-middle">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Mobile</th>
                                                        <th className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Edit Row */}
                                                    {editingParticipant && (
                                                        <tr className="table-primary">
                                                            <td><input type="text" className="form-control form-control-sm" value={editingParticipant.name} onChange={(e) => setEditingParticipant({...editingParticipant, name: e.target.value})} /></td>
                                                            <td><input type="tel" className="form-control form-control-sm" value={editingParticipant.mobile} onChange={(e) => setEditingParticipant({...editingParticipant, mobile: e.target.value})} /></td>
                                                            <td className="text-end">
                                                                <button className="btn btn-success btn-sm me-2" onClick={handleUpdateParticipant} title="Save Changes"><i className="bi bi-check-lg"></i></button>
                                                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingParticipant(null)} title="Cancel Edit"><i className="bi bi-x-lg"></i></button>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {/* Display Rows */}
                                                    {participants.map(p => (
                                                        editingParticipant?.id === p.id ? null : (
                                                        <tr key={p.id}>
                                                            <td>{p.name}</td>
                                                            <td>{p.mobile}</td>
                                                            <td className="text-end">
                                                                <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEditParticipant(p)} title="Edit Participant"><i className="bi bi-pencil-fill"></i></button>
                                                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteParticipant(p.id)} title="Delete Participant"><i className="bi bi-trash-fill"></i></button>
                                                            </td>
                                                        </tr>
                                                    )))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                );
            case 'danger':
                 return (
                     <div className="card shadow border-danger">
                        <div className="card-header bg-danger text-white">
                            <h3 className="h5 mb-0"><i className="bi bi-exclamation-triangle-fill me-2"></i>Danger Zone</h3>
                        </div>
                        <div className="card-body p-4">
                            <h4 className="h6 fw-bold text-danger">Delete This Event</h4>
                            <p className="text-muted">Once you delete an event, all associated data (including participants and the certificate template) will be permanently removed. This action cannot be undone.</p>
                            <button className="btn btn-danger" onClick={handleDeleteEvent} disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</> : 'Delete This Event Permanently'}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const shareableLink = `${window.location.origin}${window.location.pathname}#/event/${eventId}`;

    return (
        <div className="d-flex manage-event-layout">
             {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
            {/* Collapsible Sidebar */}
             <nav className="sidebar bg-dark text-white p-3 d-flex flex-column">
                 <h4 className="sidebar-title mb-4">Event Sections</h4>
                 <ul className="nav nav-pills flex-column mb-auto">
                    {/* Sidebar Links */}
                    <li className="nav-item">
                        <a href="#/" onClick={(e)=>{e.preventDefault(); setActiveSection('settings')}} className={`nav-link text-white ${activeSection === 'settings' ? 'active bg-primary' : ''}`}>
                            <i className="bi bi-gear-fill me-2 icon"></i><span className="text">Settings</span>
                        </a>
                    </li>
                     <li className="nav-item">
                        <a href="#/" onClick={(e)=>{e.preventDefault(); setActiveSection('certificate')}} className={`nav-link text-white ${activeSection === 'certificate' ? 'active bg-primary' : ''}`}>
                             <i className="bi bi-patch-check-fill me-2 icon"></i><span className="text">Certificate</span>
                         </a>
                    </li>
                    <li className="nav-item">
                        <a href="#/" onClick={(e)=>{e.preventDefault(); setActiveSection('participants')}} className={`nav-link text-white ${activeSection === 'participants' ? 'active bg-primary' : ''}`}>
                             <i className="bi bi-people-fill me-2 icon"></i><span className="text">Participants</span>
                         </a>
                    </li>
                    <li className="nav-item">
                        <a href="#/" onClick={(e)=>{e.preventDefault(); setActiveSection('danger')}} className={`nav-link text-white ${activeSection === 'danger' ? 'active bg-primary' : ''}`}>
                             <i className="bi bi-exclamation-triangle-fill me-2 icon"></i><span className="text">Danger Zone</span>
                         </a>
                    </li>
                 </ul>
                 <hr className="text-white-50"/>
                 <ul className="nav nav-pills flex-column">
                    <li className="nav-item">
                        <Link to="/admin" className="nav-link text-white">
                             <i className="bi bi-arrow-left-circle-fill me-2 icon"></i><span className="text">Back to Dashboard</span>
                        </Link>
                    </li>
                 </ul>
            </nav>

            {/* Main Content Area */}
            <main className="main-content flex-grow-1 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4 page-header">
                    <h1 className="h4 fw-bold mb-0 text-primary">{event?.eventName || 'Manage Event'}</h1>
                    <div className="input-group" style={{maxWidth: '400px'}}>
                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-link-45deg"></i></span>
                        <input type="text" className="form-control bg-light" value={shareableLink} readOnly />
                        <button className="btn btn-outline-secondary" onClick={() => {
                            navigator.clipboard.writeText(shareableLink);
                            setModalMessage('Link copied!');
                        }} title="Copy Shareable Link">
                            <i className="bi bi-clipboard-check"></i>
                        </button>
                    </div>
                </div>

                 {error && <div className="alert alert-danger" role="alert">{error}</div>}

                {renderSection()}
            </main>
        </div>
    );
};

export default ManageEventLayout;

