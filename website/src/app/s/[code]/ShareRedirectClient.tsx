'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  params: Promise<{ code: string }>;
}

export default function ShareRedirectClient({ params }: Props) {
  const router = useRouter();
  const { code } = use(params);
  
  useEffect(() => {
    async function redirect() {
      try {
        // Fetch redirect URL from API
        const response = await fetch(`/api/s/${code}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.redirectUrl) {
            // Redirect to the create page with parameters
            window.location.href = data.redirectUrl;
          } else {
            // Fallback to homepage
            router.push('/');
          }
        } else {
          // Not found - redirect to homepage
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching share data:', error);
        router.push('/');
      }
    }
    
    // Small delay to allow OG crawlers to read meta tags
    const timer = setTimeout(redirect, 500);
    
    return () => clearTimeout(timer);
  }, [code, router]);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p>Loading your AI photoshoot...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

