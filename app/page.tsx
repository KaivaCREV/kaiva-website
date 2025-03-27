'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isMicSupported, setIsMicSupported] = useState(false);
  const [isFileAttached, setIsFileAttached] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setIsMicSupported(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !attachedFile) return;

    const userMessage: Message = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsFileAttached(false);

    try {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('history', JSON.stringify(chatHistory));
      if (attachedFile) {
        formData.append('file', attachedFile);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      const aiResponse: Message = { 
        role: 'assistant', 
        content: data.message || 'Sorry, I encountered an error.' 
      };
      
      setChatHistory(prev => [...prev, aiResponse]);
      setMessage('');
      setAttachedFile(null);

    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to process request. Please try again.'}`
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be less than 10MB');
      setIsFileAttached(false);
      return;
    }

    // Check file type
    if (file.type !== 'text/plain' && file.type !== 'application/pdf') {
      setFileError('Please upload a PDF or TXT file');
      setIsFileAttached(false);
      return;
    }

    setAttachedFile(file);
    setFileError('');
    setIsFileAttached(true);
    const fileType = file.type === 'application/pdf' ? 'PDF' : 'text';
    setMessage(`Please analyze this ${fileType} document (${(file.size / 1024).toFixed(1)}KB): ${file.name}`);
  };

  const handleMicClick = () => {
    if (!isMicSupported) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + ' ' + transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-800">
      {/* Logo + Tagline Section */}
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

      {/* Assistant Image */}
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

      {/* Main Content */}
      <main className="flex-1 px-6 space-y-10 max-w-2xl mx-auto w-full">
        {/* KAIVA Chat Assistant */}
        <section className="bg-white p-6 rounded-2xl shadow border border-gray-200">
          {/* Chat History */}
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

          {/* Chat Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-6">
            <div className="flex-1 flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you wish A.I. could do for you?"
                className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label 
                className={`cursor-pointer group relative ${isFileAttached ? 'ring-2 ring-green-500' : ''}`}
                title="Upload document"
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.txt"
                />
                <span className={`${
                  isFileAttached 
                    ? 'bg-green-100 hover:bg-green-200' 
                    : 'bg-gray-200 hover:bg-gray-300'
                  } p-3 rounded-xl transition-colors flex items-center justify-center`}
                >
                  {isFileAttached ? (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 text-green-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  ) : (
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
                        d="M12 4v16m8-8H4" 
                      />
                    </svg>
                  )}
                </span>
                {/* Updated Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  {isFileAttached 
                    ? 'File ready to analyze' 
                    : 'Upload PDF or TXT (max 10MB)'}
                </div>
              </label>
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
              {/* Tooltip */}
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

          {/* Role Buttons */}
          <div className="mb-4">
            <h3 className="text-sm mb-2">What&apos;s your role in CRE:</h3>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Appraiser</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Broker</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Owner / Principle</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Loan Officer</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Lender / Bank Rep</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Tenant</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Owner Representative</button>
              <button className="text-xs bg-[#0F3653] text-white px-3 py-1 rounded-full">Other...</button>
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-1">Try one:</div>
            <div className="flex flex-wrap gap-2">
              <button className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">Abstract a Lease</button>
              <button className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full">USPAP Compliance Review</button>
              <button className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Commercial Valuation Estimate</button>
            </div>
          </div>

          {/* File Error Display */}
          {fileError && (
            <div className="text-red-500 text-xs mt-1">
              {fileError}
            </div>
          )}

          {/* File Info Display */}
          {attachedFile && (
            <div className="mt-2 text-sm text-gray-600 flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
                />
              </svg>
              <span>
                Attached: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)}KB)
              </span>
              <button
                type="button"
                onClick={() => {
                  setAttachedFile(null);
                  setIsFileAttached(false);
                  setMessage('');
                }}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer tagline */}
      <footer className="text-center py-8 text-sm text-gray-500 italic">
        What CRE tasks have you done 1,000,000 times? Let KAIVA handle it.
      </footer>
    </div>
  );
}

