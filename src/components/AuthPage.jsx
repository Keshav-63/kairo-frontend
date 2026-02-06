import React from 'react';

const AuthPage = () => {
  const handleGoogleLogin = () => {
    // Redirect to the backend OAuth route
    window.location.href = 'https://shreeyanshsingh-raghuvanshi-kairob.hf.space/api/auth/web/google';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="backdrop-blur-glass rounded-2xl p-8 border border-border/50">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 glow-primary">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Kairo</h1>
            <p className="text-muted-foreground">Sign in to unlock your memory assistant</p>
          </div>

          {/* OAuth Provider Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-3 bg-white text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.5 8.1c0-.6-.1-1.2-.2-1.7H9v3.2h4.5c-.2.8-.7 1.5-1.4 1.9v2.1h2.7c1.6-1.5 2.5-3.8 2.5-6.3z"/><path fill="#34A853" d="M9 17.5c2.4 0 4.5-.8 6-2.1l-2.7-2.1c-.8.6-1.9 1-3.3 1-2.3 0-4.3-1.5-5-3.6H.6v2.2C2.1 15.7 5.3 17.5 9 17.5z"/><path fill="#FBBC05" d="M4 10.4c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V4.6H1.3c-.6 1.1-.9 2.4-.9 3.8s.3 2.7.9 3.8L4 10.4z"/><path fill="#EA4335" d="M9 4C10.3 4 11.5 4.5 12.5 5.5l2.1-2.1C13.5 2.1 11.4 1 9 1 5.3 1 2.1 2.9.6 5.5l3.4 2.7C4.7 5.5 6.7 4 9 4z"/></svg>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              By signing in, you agree to Kairo's Terms and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;