import React, { useState } from "react";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setDownloadUrl(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setDownloadUrl(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.download_url) {
        setDownloadUrl(`http://127.0.0.1:8000${data.download_url}`);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center">Lease Abstract Generator</h1>
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf"
          className="w-full border rounded p-2"
        />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Upload & Generate Abstract"}
        </button>

        {downloadUrl && (
          <div className="text-center mt-4">
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline font-semibold"
            >
              Download Lease Abstract
            </a>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
