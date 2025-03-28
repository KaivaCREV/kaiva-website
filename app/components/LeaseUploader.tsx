'use client';
import { useState } from 'react';

export default function LeaseUploader() {
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/abstract-lease', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to process lease');
      }

      const data = await res.json();
      setAbstract(data.abstract || '');
    } catch (err) {
      setError('Failed to process lease. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".pdf,.txt"
        onChange={handleUpload}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {loading && (
        <div className="text-gray-600">Processing lease...</div>
      )}

      {abstract && !loading && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Lease Abstract</h3>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: abstract }} />
        </div>
      )}
    </div>
  );
} 