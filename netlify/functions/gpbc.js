/**
 * GPBC Finance Desk — Same-Origin Netlify API Proxy Function
 * 
 * Proxies browser requests from same-origin https://finance.gracepraise.church/api/gpbc
 * to the authoritative production Google Apps Script Web App backend.
 * 
 * Follows Google Apps Script redirects server-side so the browser receives
 * final JSON responses directly without cross-origin redirects.
 */

const UPSTREAM_URL = 'https://script.google.com/macros/s/AKfycbwx3CYYFDu_wUIepfOuY3rVu9OE9lC5woV1X01lcDYFz_QMMx25wsyviSamIKkhILG5/exec';
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 5;
const ALLOWED_REDIRECT_HOSTS = new Set([
  'script.google.com',
  'script.googleusercontent.com'
]);

function getHeader(headers, name) {
  if (!headers || typeof headers.get !== 'function') return null;
  return headers.get(name) || headers.get(name.toLowerCase());
}

function redirectMethod(status, method) {
  if ((status === 301 || status === 302 || status === 303) && method !== 'HEAD') {
    return 'GET';
  }
  return method;
}

function isJsonBody(body) {
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

function buildRequestOptions(method, body) {
  const headers = {
    'Accept': 'application/json'
  };

  const options = {
    method,
    headers,
    redirect: 'manual'
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'text/plain';
    options.body = body || '';
  }

  return options;
}

async function fetchUpstreamWithRedirects(initialUrl, initialMethod, initialBody) {
  let targetUrl = initialUrl;
  let method = initialMethod;
  let body = initialBody;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const upstreamResponse = await fetch(targetUrl, buildRequestOptions(method, body));
    const location = getHeader(upstreamResponse.headers, 'location');

    if (!REDIRECT_STATUSES.has(upstreamResponse.status) || !location) {
      return upstreamResponse;
    }

    if (redirectCount === MAX_REDIRECTS) {
      throw new Error('Too many upstream redirects');
    }

    const redirectUrl = new URL(location, targetUrl);
    if (
      redirectUrl.protocol !== 'https:' ||
      !ALLOWED_REDIRECT_HOSTS.has(redirectUrl.hostname)
    ) {
      throw new Error('Disallowed upstream redirect');
    }

    method = redirectMethod(upstreamResponse.status, method);
    body = method === 'POST' ? body : undefined;
    targetUrl = redirectUrl.toString();
  }

  throw new Error('Unable to follow upstream redirect');
}

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
    let body = undefined;
    if (method === 'POST') body = event.body || '';

    let targetUrl = UPSTREAM_URL;
    if (event.rawQuery) {
      targetUrl += `?${event.rawQuery}`;
    } else if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
      const qs = new URLSearchParams(event.queryStringParameters).toString();
      if (qs) targetUrl += `?${qs}`;
    }

    const upstreamResponse = await fetchUpstreamWithRedirects(targetUrl, method, body);

    const responseText = await upstreamResponse.text();
    const upstreamContentType = getHeader(upstreamResponse.headers, 'content-type');
    const contentType = isJsonBody(responseText)
      ? (upstreamContentType && upstreamContentType.toLowerCase().includes('json')
        ? upstreamContentType
        : 'application/json; charset=utf-8')
      : (upstreamContentType || 'text/plain; charset=utf-8');

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
