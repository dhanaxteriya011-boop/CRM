import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Files() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState('App\\Models\\Contact');
  const [relatedId, setRelatedId] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fileable_type', type);
    fd.append('fileable_id', relatedId);
    await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setMsg('File uploaded!');
  };

  return (
    <div>
      <h2>File Upload</h2>
      <p>Files are attached to contacts, leads, or deals. Use the detail pages for each record.</p>
      {msg && <p style={{color:'green'}}>{msg}</p>}
      <form onSubmit={handleUpload}>
        <div><label>Type: <select value={type} onChange={e=>setType(e.target.value)}>
          <option value="App\\Models\\Contact">Contact</option>
          <option value="App\\Models\\Lead">Lead</option>
          <option value="App\\Models\\Deal">Deal</option>
        </select></label></div>
        <div><label>Record ID: <input type="number" value={relatedId} onChange={e=>setRelatedId(e.target.value)} required /></label></div>
        <div><label>File: <input type="file" onChange={e=>setFile(e.target.files[0])} required /></label></div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}