/* ════════════════════════════════════════════════════════════
   Firebase App Check — proves a request really comes from THIS website
   (not a script hitting the Firestore REST API directly).

   OFF by default. To switch it on (5 minutes, see SECURITY-REPORT):
     1. Firebase console → App Check → Apps → Register the web app with reCAPTCHA v3
     2. Paste the reCAPTCHA *site* key (public) below
     3. Watch "Metrics" for a day, then click "Enforce" for Cloud Firestore
   The site key is public by design (it is not a secret).
════════════════════════════════════════════════════════════ */
export const APP_CHECK_SITE_KEY = '';

export async function enableAppCheck(app) {
  if (!APP_CHECK_SITE_KEY) return false;
  try {
    const m = await import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-check.js');
    m.initializeAppCheck(app, {
      provider: new m.ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    return true;
  } catch (e) {
    console.warn('[app-check] could not start:', e && e.message);
    return false;
  }
}
