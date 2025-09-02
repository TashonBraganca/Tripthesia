"use client"

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#030B14', 
          color: '#E6F0F8', 
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ 
              backgroundColor: '#0A2540', 
              padding: '2rem', 
              borderRadius: '1rem', 
              border: '1px solid #1B3B6F' 
            }}>
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                color: '#FF6B6B', 
                margin: '0 auto 1rem', 
                fontSize: '4rem', 
                textAlign: 'center' 
              }}>⚠</div>
              
              <h1 style={{ 
                fontSize: '2rem', 
                marginBottom: '1rem', 
                color: '#E6F0F8' 
              }}>
                Critical Application Error
              </h1>
              
              <p style={{ 
                fontSize: '1.2rem', 
                marginBottom: '2rem', 
                color: '#B8C7D3' 
              }}>
                The application encountered a critical error and cannot continue.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div style={{
                  backgroundColor: '#FF6B6B20',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <pre style={{
                    color: '#FF6B6B',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    margin: 0
                  }}>
                    {error.message}
                  </pre>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'center', 
                flexWrap: 'wrap' 
              }}>
                <button 
                  onClick={reset}
                  style={{ 
                    backgroundColor: '#15B37D', 
                    color: '#030B14', 
                    padding: '1rem 2rem', 
                    borderRadius: '0.5rem', 
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  🔄 Retry
                </button>
                
                <a 
                  href="/"
                  style={{ 
                    backgroundColor: '#1B3B6F', 
                    color: '#E6F0F8', 
                    padding: '1rem 2rem', 
                    borderRadius: '0.5rem', 
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}
                >
                  🏠 Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}