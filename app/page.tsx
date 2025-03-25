import Image from 'next/image';

export default function Home() {
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
        <p className="text-sm text-gray-500">What CRE tasks have you done 1,000,000 times? Let KAIVA handle it.</p>
      </header>

      {/* Assistant Image */}
      <div className="flex justify-center mb-6">
        <Image
          src="/kai-asst.jpg"
          alt="AI Assistant"
          width={500}
          height={300}
          className="rounded-lg shadow-md w-full max-w-md"
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 space-y-10 max-w-2xl mx-auto w-full">
        {/* KAIVA Chat Assistant */}
        <section className="bg-white p-6 rounded-2xl shadow border border-gray-200">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm font-medium">I'm Kai, your CRE A.I. Assistant Extraordinaire...</span>
            <button className="text-sm text-blue-500 hover:underline">New Chat</button>
          </div>

          <div className="flex items-center space-x-2 mb-6">
            <input
              type="text"
              placeholder="What do you wish A.I. could do for you?"
              className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-gray-200 p-2 rounded-full" title="Use Microphone">🎤</button>
            <button className="bg-[#0F3653] text-white px-4 py-2 rounded-xl shadow hover:opacity-90">Send</button>
          </div>

          {/* Role Buttons */}
          <div className="mb-4">
            <h3 className="text-sm mb-2">What's your role in CRE:</h3>
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
        </section>
      </main>
    </div>
  );
}

