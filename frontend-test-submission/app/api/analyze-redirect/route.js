import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Analyze the URL for redirects
    const result = await analyzeRedirect(url);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing redirect:', error);
    return NextResponse.json({ error: 'Failed to analyze redirect' }, { status: 500 });
  }
}

async function analyzeRedirect(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const statusCode = response.status;
    let redirectUrl = null;
    let isSuspicious = false;

    // Check for redirect status codes
    if (statusCode >= 300 && statusCode < 400) {
      redirectUrl = response.headers.get('location');
      
      // Check for suspicious patterns
      if (redirectUrl) {
        isSuspicious = checkSuspiciousPatterns(redirectUrl);
      }
    }

    return {
      statusCode,
      redirectUrl,
      isSuspicious
    };
  } catch (error) {
    return {
      statusCode: 0,
      redirectUrl: null,
      isSuspicious: false,
      error: error.message
    };
  }
}

function checkSuspiciousPatterns(url) {
  const suspiciousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /ftp:/i,
    /mailto:/i,
    /tel:/i,
    /sms:/i,
    /paypal.*\.com.*\.com/i,
    /google.*\.com.*\.com/i,
    /facebook.*\.com.*\.com/i,
    /amazon.*\.com.*\.com/i,
    /bank.*\.com.*\.com/i
  ];

  return suspiciousPatterns.some(pattern => pattern.test(url));
} 