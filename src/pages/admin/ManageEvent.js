import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, deleteDoc as deleteParticipantDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import * as XLSX from 'xlsx';

const ManageEvent = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    // State for General Settings
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [mode, setMode] = useState('public');

    // State for Certificate
    const [certificateFile, setCertificateFile] = useState(null);
    const [certificatePreview, setCertificatePreview] = useState('');
    const [fontSize, setFontSize] = useState(60);
    const [positionX, setPositionX] = useState(50);
    const [positionY, setPositionY] = useState(50);
    const [fontWeight, setFontWeight] = useState('bold'); // New state for font weight

    // State for Participants
    const [participants, setParticipants] = useState([]);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [newParticipantMobile, setNewParticipantMobile] = useState('');

    useEffect(() => {
        const fetchEventAndParticipants = async () => {
            try {
                setLoading(true);
                const eventDocRef = doc(db, 'events', eventId);
                const eventSnap = await getDoc(eventDocRef);

                if (eventSnap.exists()) {
                    const eventData = eventSnap.data();
                    setEvent(eventData);
                    setEventName(eventData.eventName);
                    setEventDescription(eventData.eventDescription);
                    setMode(eventData.mode);
                    setCertificatePreview(eventData.certificateUrl || '');
                    setFontSize(eventData.fontSize || 60);
                    setPositionX(eventData.positionX || 50);
                    setPositionY(eventData.positionY || 50);
                    setFontWeight(eventData.fontWeight || 'bold'); // Load font weight

                    if (eventData.mode === 'manual') {
                        const participantsCollectionRef = collection(db, 'events', eventId, 'participants');
                        const q = query(participantsCollectionRef, orderBy('name'));
                        const participantsSnap = await getDocs(q);
                        const participantsList = participantsSnap.docs.map(pDoc => ({ id: pDoc.id, ...pDoc.data() }));
                        setParticipants(participantsList);
                    }
                } else {
                    setError('Event not found.');
                }
            } catch (err) {
                setError('Failed to load event data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndParticipants();
    }, [eventId]);

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            let certificateUrl = event.certificateUrl;
            if (certificateFile) {
                const storageRef = ref(storage, `certificates/${Date.now()}_${certificateFile.name}`);
                await uploadBytes(storageRef, certificateFile);
                certificateUrl = await getDownloadURL(storageRef);
                setCertificatePreview(certificateUrl);
            }

            const eventDocRef = doc(db, 'events', eventId);
            await updateDoc(eventDocRef, {
                eventName,
                eventDescription,
                mode,
                certificateUrl,
                fontSize,
                positionX,
                positionY,
                fontWeight, // Save font weight
            });
            alert('Event updated successfully!');
        } catch (err) {
            alert('Failed to update event.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteEvent = async () => {
        if (window.confirm('Are you sure you want to delete this event permanently?')) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                alert('Event deleted successfully.');
                navigate('/admin/dashboard');
            } catch (err) {
                alert('Failed to delete event.');
            }
        }
    };

    const handleAddParticipant = async (e) => {
        e.preventDefault();
        if (!newParticipantName.trim() || !newParticipantMobile.trim()) return;
        const participantsCollectionRef = collection(db, 'events', eventId, 'participants');
        const docRef = await addDoc(participantsCollectionRef, { 
            name: newParticipantName,
            mobile: newParticipantMobile 
        });
        setParticipants([...participants, { id: docRef.id, name: newParticipantName, mobile: newParticipantMobile }].sort((a,b) => a.name.localeCompare(b.name)));
        setNewParticipantName('');
        setNewParticipantMobile('');
    };
    
    const handleDeleteParticipant = async (participantId) => {
        if (window.confirm('Remove this participant?')) {
            await deleteParticipantDoc(doc(db, 'events', eventId, 'participants', participantId));
            setParticipants(participants.filter(p => p.id !== participantId));
        }
    };
    
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCertificateFile(file);
            setCertificatePreview(URL.createObjectURL(file));
        }
    };

    const handleExcelUpload = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const newParticipants = data.slice(1).map(row => ({ name: row[0], mobile: String(row[1]) })).filter(p => p.name && p.mobile);
            
            const participantsCollectionRef = collection(db, 'events', eventId, 'participants');
            for (const participant of newParticipants) {
                await addDoc(participantsCollectionRef, participant);
            }
            const participantsSnap = await getDocs(query(participantsCollectionRef, orderBy('name')));
            setParticipants(participantsSnap.docs.map(pDoc => ({ id: pDoc.id, ...pDoc.data() })));
            alert(`${newParticipants.length} participants added successfully!`);
        };
        reader.readAsBinaryString(file);
    };

    if (loading && !event) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border"></div></div>;
    if (error) return <div className="vh-100 d-flex justify-content-center align-items-center"><p className="alert alert-danger">{error}</p></div>;

    return (
        <div className="min-vh-100 p-4" style={{ backgroundColor: '#f0f2f5' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Link to="/admin/dashboard" className="btn btn-outline-secondary mb-2"><i className="bi bi-arrow-left"></i> Back</Link>
                        <h1 className="h2 fw-bold text-primary">{event?.eventName}</h1>
                    </div>
                    <button className="btn btn-success" onClick={handleSaveChanges} disabled={loading}>{loading ? 'Saving...' : 'Save All Changes'}</button>
                </div>
                <div className="card shadow-sm border-0">
                    <div className="card-header">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item"><button className={`nav-link ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button></li>
                            <li className="nav-item"><button className={`nav-link ${activeTab === 'certificate' ? 'active' : ''}`} onClick={() => setActiveTab('certificate')}>Certificate</button></li>
                            <li className="nav-item"><button className={`nav-link ${activeTab === 'participants' ? 'active' : ''}`} onClick={() => setActiveTab('participants')}>Participants</button></li>
                            <li className="nav-item"><button className={`nav-link ${activeTab === 'danger' ? 'active' : ''}`} onClick={() => setActiveTab('danger')}>Danger Zone</button></li>
                        </ul>
                    </div>
                    <div className="card-body p-4">
                        {activeTab === 'general' && (
                            <div>
                                <h4 className="mb-3">General Settings</h4>
                                <div className="mb-3"><label className="form-label">Event Name</label><input type="text" className="form-control" value={eventName} onChange={(e) => setEventName(e.target.value)} /></div>
                                <div className="mb-3"><label className="form-label">Event Description</label><textarea className="form-control" rows="3" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}></textarea></div>
                                <div className="mb-3"><label className="form-label">Certificate Mode</label><select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}><option value="public">Public</option><option value="manual">Manual</option></select></div>
                            </div>
                        )}
                        {activeTab === 'certificate' && (
                           <div className="row g-4">
                                <div className="col-md-8">
                                    <h4 className="mb-3">Certificate Preview</h4>
                                    <div className="position-relative">
                                        {certificatePreview ? (
                                            <>
                                                <img src={certificatePreview} alt="Preview" className="img-fluid rounded border" />
                                                <p className="position-absolute user-select-none" style={{
                                                    top: `${positionY}%`,
                                                    left: `${positionX}%`,
                                                    transform: 'translate(-50%, -50%)',
                                                    fontSize: `${fontSize / 30}vw`, // Responsive preview
                                                    fontWeight: fontWeight, // Use state for font weight
                                                    color: 'black',
                                                    textShadow: '0px 0px 5px white',
                                                }}>
                                                    Participant Name
                                                </p>
                                            </>
                                        ) : (
                                            <div className="text-center p-5 bg-light rounded">No template uploaded.</div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                     <h4 className="mb-3">Upload Template</h4>
                                     <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} />
                                     <hr className="my-4"/>
                                     <h4 className="mb-3">Text Customization</h4>
                                     <div className="mb-3">
                                         <label className="form-label">Font Weight</label>
                                         <select className="form-select" value={fontWeight} onChange={e => setFontWeight(e.target.value)}>
                                             <option value="normal">Normal</option>
                                             <option value="bold">Bold</option>
                                         </select>
                                     </div>
                                     <div className="mb-3">
                                         <label className="form-label">Font Size: {fontSize}px</label>
                                         <input type="range" className="form-range" min="10" max="150" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
                                     </div>
                                     <div className="mb-3">
                                         <label className="form-label">Horizontal Position: {positionX}%</label>
                                         <input type="range" className="form-range" min="0" max="100" value={positionX} onChange={e => setPositionX(Number(e.target.value))} />
                                     </div>
                                     <div className="mb-3">
                                         <label className="form-label">Vertical Position: {positionY}%</label>
                                         <input type="range" className="form-range" min="0" max="100" value={positionY} onChange={e => setPositionY(Number(e.target.value))} />
                                     </div>
                                </div>
                           </div>
                        )}
                        {activeTab === 'participants' && (
                             mode === 'manual' ? (
                                <div>
                                    <h4 className="mb-3">Manage Participants</h4>
                                    <div className="row g-3">
                                        <div className="col-md-6"><div className="card"><div className="card-body"><h5 className="card-title">Add Participant</h5><form onSubmit={handleAddParticipant}><div className="mb-2"><input type="text" className="form-control" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} placeholder="Full Name" required/></div><div className="mb-2"><input type="tel" className="form-control" value={newParticipantMobile} onChange={(e) => setNewParticipantMobile(e.target.value)} placeholder="Mobile Number" required /></div><button className="btn btn-primary w-100" type="submit">Add</button></form></div></div></div>
                                        <div className="col-md-6"><div className="card"><div className="card-body"><h5 className="card-title">Upload Excel</h5><p className="small text-muted">.xlsx file: Name (Col A), Mobile (Col B).</p><input type="file" className="form-control" accept=".xlsx" onChange={handleExcelUpload} /></div></div></div>
                                    </div>
                                    <hr className="my-4" />
                                    <h5 className="mb-3">Participant List ({participants.length})</h5>
                                    <div className="list-group">{participants.map(p => (<div key={p.id} className="list-group-item d-flex justify-content-between align-items-center"><div><div className="fw-bold">{p.name}</div><div className="text-muted small">{p.mobile}</div></div><button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteParticipant(p.id)}><i className="bi bi-trash"></i></button></div>))}</div>
                                </div>
                            ) : (<div className="text-center p-4 bg-light rounded"><p className="mb-0">Participant management is only available in "Manual" mode.</p></div>)
                        )}
                         {activeTab === 'danger' && (
                            <div>
                                <h4 className="text-danger">Danger Zone</h4>
                                <div className="p-3 border border-danger rounded">
                                    <p className="fw-bold">Delete this event</p>
                                    <p className="small text-muted">This action cannot be undone.</p>
                                    <button className="btn btn-danger" onClick={handleDeleteEvent}>Delete Event</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageEvent;
