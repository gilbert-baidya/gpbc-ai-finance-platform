/**
 * GPBC Finance Desk — Same-Origin Netlify API Proxy Function
 * 
 * Proxies browser requests from same-origin https://finance.gracepraise.church/api/gpbc
 * to the authoritative production Google Apps Script Web App backend.
 * 
 * Follows Google Apps Script internal 302 redirects server-side so the browser
 * receives final JSON responses directly without cross-origin redirects.
 */

const UPSTREAM_URL = 'https://script.google.com/macros/s/AKfycbwx3CYYFDu_wUIepfOuY3rVu9OE9lC5woV1X01lcDYFz_QMMx25wsyviSamIKkhILG5/exec';

export const handler = async (event) => {
  const method = event.httpMethod;

  // Enforce allowed HTTP methods only
  if (method !== 'GET' && method !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const headers = {
      'Accept': 'application/json'
    };

    let body = undefined;
    if (method === 'POST') {
      headers['Content-Type'] = 'text/plain';
      body = event.body || '';
    }

    let targetUrl = UPSTREAM_URL;
    if (event.rawQuery) {
      targetUrl += `?${event.rawQuery}`;
    } else if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
      const qs = new URLSearchParams(event.queryStringParameters).toString();
      if (qs) targetUrl += `?${qs}`;
    }

    // Follow Google Apps Script 302 redirects server-side
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: 'follow'
    });

    const responseText = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json';

    return {
      statusCode: upstreamResponse.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
      },
      body: responseText
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ success: false, error: 'Upstream gateway error' })
    };
  }
};
