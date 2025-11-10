'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@primeshot/common/lib/api/client';

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
        console.log('Fetching redirect URL for code:', code);
        const response = await fetch(getApiUrl(`/api/s/${code}`));
        
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          
          if (data.redirectUrl) {
            // Redirect to the create page with parameters
            console.log('Redirecting to:', data.redirectUrl);
            window.location.href = data.redirectUrl;
          } else {
            // Fallback to homepage
            console.log('No redirectUrl in response, going to homepage');
            router.push('/');
          }
        } else {
          // Not found - redirect to homepage
          console.error('API request failed with status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching share data:', error);
        router.push('/');
      }
    }
    
    // Small delay to allow OG crawlers to read meta tags (100ms is enough)
    const timer = setTimeout(redirect, 100);
    
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

