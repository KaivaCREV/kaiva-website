// pages/index.tsx (or similar Home component)
'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type SpeechRecognitionEvent = {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
};

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition; // Ideally replace 'any' with proper type
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [abstractUrl, setAbstractUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsMicSupported(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const userMessage: Message = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('history', JSON.stringify(chatHistory));
      
      console.log('Sending chat request...'); // Add logging
      const response = await fetch('/api/chat', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat API failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse: Message = { 
        role: 'assistant', 
        content: data.message || 'Sorry, I encountered an error.' 
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setMessage('');
    } catch (error) {
      console.error('Chat error:', error); // Add error logging
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request.'}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (!isMicSupported) return alert('Speech recognition not supported');
    const recognition = new window.webkitSpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + ' ' + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleLeaseUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Sending lease file to FastAPI server...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      // Log full response details
      console.log({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Server response:', result);

      if (result.error) {
        const errorMsg = `Error processing lease: ${result.error}. Please try again or contact support if the issue persists.`;
        throw new Error(errorMsg);
      }

      if (result.download_url) {
        const fullUrl = `${API_URL}${result.download_url}`;
        setAbstractUrl(fullUrl);
        const successMsg: Message = {
          role: 'assistant',
          content: `Lease abstract generated successfully! Processing ${file.name}. Click the link below to download the Excel file.`
        };
        setChatHistory(prev => [...prev, successMsg]);
      }
    } catch (err) {
      console.error('Lease processing error:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Failed to process the lease: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-800">
      <header className="flex flex-col items-center text-center py-6 space-y-2">
        <Image
          src="/kaiva-logo.jpg"
          alt="KAIVA Logo"
          width={256}
          height={256}
          className="h-32 object-contain"
        />
        <h1 className="text-xl font-semibold mt-2">The Best A.I. Assistant for CRE Pros</h1>
      </header>

      <div className="flex flex-col items-center mb-6">
        <Image
          src="/kai-asst.jpg"
          alt="AI Assistant"
          width={500}
          height={300}
          className="rounded-lg shadow-md w-full max-w-md"
        />
        <span className="text-sm font-medium mt-4">Hey there! I&apos;m Kai, your CRE A.I. Assistant Extraordinaire...</span>
      </div>

      <main className="flex-1 px-6 space-y-10 max-w-2xl mx-auto w-full">
        <section className="bg-white p-6 rounded-2xl shadow border border-gray-200">
          <div className="mb-6 space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-[#0F3653] text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-6">
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you wish A.I. could do for you?"
                className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              type="button" 
              onClick={handleMicClick}
              className={`relative group p-3 rounded-xl ${
                isListening ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors`}
              title="Use voice input"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                />
              </svg>
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {isListening ? 'Listening...' : 'Click to use voice input'}
              </div>
            </button>
            <button 
              type="submit"
              disabled={isLoading} 
              className="bg-[#0F3653] text-white px-4 py-2 rounded-xl shadow hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>

          <div className="flex items-center gap-2">
            <input
              type="file"
              id="lease-file"
              className="hidden"
              accept=".pdf"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="lease-file" className="bg-gray-200 text-sm px-3 py-1 rounded cursor-pointer">
              {file ? file.name : 'Choose Lease File'}
            </label>
            <button
              onClick={handleLeaseUpload}
              disabled={!file || uploading}
              className="bg-green-600 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
            >
              {uploading ? 'Processing...' : 'Abstract Lease'}
            </button>
          </div>

          {abstractUrl && (
            <a
              href={abstractUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 text-sm underline block mt-2"
            >
              Download Lease Abstract
            </a>
          )}
        </section>
      </main>

      <footer className="text-center text-sm text-gray-400 mt-10">
        What CRE tasks have you done 1,000,000 times? Let KAIVA handle it.
      </footer>
    </div>
  );
}
