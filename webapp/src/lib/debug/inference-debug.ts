/**
 * Debug utilities for inference system
 */

export function checkInferenceConfiguration() {
  const config = {
    websocketUrl: process.env.NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL,
    cloudfrontDomain: process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  console.group('🔍 Inference Configuration Check');
  
  // WebSocket URL
  if (config.websocketUrl) {
    console.log('✅ NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL:', config.websocketUrl);
  } else {
    console.warn('❌ NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL not configured');
    console.warn('   Expected format: wss://creativebuild--primeshot-inference-progress.modal.run');
    console.warn('   Falling back to database polling');
  }

  // CloudFront Domain
  if (config.cloudfrontDomain) {
    console.log('✅ NEXT_PUBLIC_CLOUDFRONT_DOMAIN:', config.cloudfrontDomain);
  } else {
    console.warn('⚠️ NEXT_PUBLIC_CLOUDFRONT_DOMAIN not configured, using default: d3el9qajjnmn76.cloudfront.net');
  }

  // Supabase URL
  if (config.supabaseUrl) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', config.supabaseUrl.substring(0, 30) + '...');
  } else {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not configured');
  }

  console.groupEnd();
  return config;
}

export function logInferenceJobActivity(action: string, jobId: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.log(`🎯 [${timestamp}] ${action} - Job: ${jobId}`, details || '');
}

export function testWebSocketConnection(jobId: string = 'test-job-123') {
  const wsUrl = process.env.NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL;
  
  if (!wsUrl) {
    console.error('❌ Cannot test WebSocket: NEXT_PUBLIC_INFERENCE_WEBSOCKET_URL not configured');
    return;
  }

  console.group('🧪 Testing WebSocket Connection');
  console.log('URL:', wsUrl);
  console.log('Test Job ID:', jobId);
  
  try {
    const testUrl = `${wsUrl}/ws/progress/${jobId}`;
    console.log('Full URL:', testUrl);
    
    const ws = new WebSocket(testUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connection opened successfully');
      ws.close();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket connection error:', error);
    };
    
    ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
    };
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.warn('⏰ WebSocket connection timeout after 10 seconds');
        ws.close();
      }
    }, 10000);
    
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error);
  }
  
  console.groupEnd();
}
