export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Tripthesia Test Page</h1>
        <p className="text-lg">If you can see this, the app is working!</p>
        <div className="mt-8 space-y-2">
          <p>✅ Next.js App Router: Working</p>
          <p>✅ TypeScript: Compiled</p>
          <p>✅ Tailwind CSS: Styling Applied</p>
          <p>✅ Vercel Deployment: Success</p>
        </div>
        <div className="mt-8">
          <a 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}