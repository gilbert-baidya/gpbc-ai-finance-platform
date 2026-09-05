const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GIS_SCRIPT_SELECTOR = `script[src="${GIS_SCRIPT_SRC}"]`;
export const GOOGLE_IDENTITY_LOCAL_ORIGINS = Object.freeze([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

let scriptPromise;
let initializedClientId;
let credentialHandler;

const loadGoogleIdentityScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(GIS_SCRIPT_SELECTOR);
    const script = existingScript || document.createElement('script');

    const handleLoad = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        scriptPromise = undefined;
        reject(new Error('Google Identity Services loaded without the expected API'));
      }
    };
    const handleError = () => {
      scriptPromise = undefined;
      reject(new Error('Google Identity Services could not be loaded'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return scriptPromise;
};

export const prepareGoogleIdentity = async (clientId) => {
  const googleIdentity = await loadGoogleIdentityScript();

  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error('Google Identity Services is already initialized with a different client ID');
  }

  if (!initializedClientId) {
    googleIdentity.initialize({
      client_id: clientId,
      callback: (response) => credentialHandler?.(response),
    });
    initializedClientId = clientId;
  }

  return googleIdentity;
};

export const setGoogleCredentialHandler = (handler) => {
  credentialHandler = handler;

  return () => {
    if (credentialHandler === handler) credentialHandler = undefined;
  };
};

export const getGoogleIdentityOrigin = () => window.location.origin;

export const isSupportedLocalGoogleIdentityOrigin = (origin) => (
  GOOGLE_IDENTITY_LOCAL_ORIGINS.includes(origin)
);