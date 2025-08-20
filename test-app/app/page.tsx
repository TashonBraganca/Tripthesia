export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎯 Tripthesia Test App
        </h1>
        
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <strong>✅ SUCCESS!</strong> Next.js is running properly.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">✅ Working Features</h2>
            <ul className="space-y-2 text-sm">
              <li>• Next.js 14 App Router</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• Environment Variables</li>
              <li>• Clean Build System</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🚀 Ready for</h2>
            <ul className="space-y-2 text-sm">
              <li>• Adding full Tripthesia components</li>
              <li>• Database integration</li>
              <li>• AI functionality</li>
              <li>• Authentication</li>
              <li>• Payment system</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">🧪 Test Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="/test-places" 
              className="block bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
            >
              <h3 className="font-medium text-green-800">🗺️ Test Places Search</h3>
              <p className="text-sm text-green-600">Test Foursquare API integration</p>
            </a>
            <a 
              href="/test-flights" 
              className="block bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
            >
              <h3 className="font-medium text-blue-800">✈️ Test Flight Search</h3>
              <p className="text-sm text-blue-600">Realistic mock flight data (Kiwi alternative)</p>
            </a>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            This proves the setup works! You can now copy components from the main app.
          </p>
        </div>
      </div>
    </main>
  );
}