import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  try {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your Tripthesia account</p>
          </div>
          
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
                card: 'shadow-lg border-0',
                headerTitle: 'text-2xl font-bold',
                headerSubtitle: 'text-gray-600 dark:text-gray-400',
                socialButtonsIconButton: 'border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
              },
            }}
            forceRedirectUrl="/trips"
            signUpUrl="/sign-up"
            routing="path"
            path="/sign-in"
          />
          
          <div className="mt-8 text-center">
            <a href="/" className="text-blue-600 hover:text-blue-700 text-sm">
              ← Back to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign In</h1>
          <p className="mb-4">Loading sign-in form...</p>
          <a href="/" className="text-blue-400 underline">Back to Home</a>
        </div>
      </div>
    );
  }
}