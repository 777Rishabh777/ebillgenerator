(function attachBillGenGoogleAuthConfig(global) {
  const GOOGLE_CLIENT_ID = '63402011727-3rgnod0av5hfrfel10elv6v3ce3poree.apps.googleusercontent.com';

  function decodeCredentialPayload(credential) {
    if (!credential || typeof credential !== 'string') {
      throw new Error('Missing Google credential.');
    }

    const parts = credential.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid Google credential format.');
    }

    const base64Url = parts[1];
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json);
  }

  global.BillGenGoogleAuth = {
    clientId: GOOGLE_CLIENT_ID,
    isConfigured() {
      return Boolean(GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID'));
    },
    decodeCredentialPayload,
  };
})(window);
