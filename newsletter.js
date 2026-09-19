/* ════════════════════════════════════════════════════════════
   NEWSLETTER SIGNUP — injects a "Stay Updated" email capture bar
   at the top of the footer on every page. Writes to a NEW
   Firestore collection ("newsletter_signups") in the same
   Firebase project the CRM uses — does not touch or read any
   existing CRM/quotation data.

   Firebase is lazy-loaded only when the user submits, so the
   bar itself always renders even if the Firebase CDN is slow,
   blocked, or briefly unreachable.
════════════════════════════════════════════════════════════ */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyC0vwKNfJ4cb9WvGrir8U5oGyWdwNk3TvQ",
    authDomain: "rr-teen-set-quotation.firebaseapp.com",
    databaseURL: "https://rr-teen-set-quotation-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "rr-teen-set-quotation",
    storageBucket: "rr-teen-set-quotation.firebasestorage.app",
    messagingSenderId: "871289668592",
    appId: "1:871289668592:web:6bda2d9f255e61294f1335",
    measurementId: "G-N28CZBQ66C"
  };

  function injectBar() {
    const footer = document.querySelector('footer');
    if (!footer || document.getElementById('newsletter-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'newsletter-bar';
    bar.innerHTML = `
      <div class="nl-inner">
        <div class="nl-text">
          <strong>Stay Updated</strong>
          <span>Tips, price updates &amp; project stories — no spam, unsubscribe anytime.</span>
        </div>
        <form id="nl-form" novalidate>
          <input id="nl-email" type="email" placeholder="you@email.com" required autocomplete="email">
          <button type="submit">Subscribe</button>
        </form>
        <p id="nl-msg" role="status"></p>
      </div>`;
    footer.prepend(bar);

    const form = document.getElementById('nl-form');
    const input = document.getElementById('nl-email');
    const msg = document.getElementById('nl-msg');
    const btn = form.querySelector('button');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = input.value.trim();
      if (!email) return;
      btn.disabled = true;
      btn.textContent = 'Saving...';
      msg.textContent = '';
      msg.className = '';

      try {
        const [{ initializeApp, getApps }, { getFirestore, doc, setDoc, serverTimestamp }] = await Promise.all([
          import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
          import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore-lite.js")
        ]);
        const existing = getApps();
        const app = existing.length ? existing[0] : initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const id = email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
        await setDoc(doc(db, 'newsletter_signups', id), {
          email: email,
          source_page: window.location.pathname,
          created_at: serverTimestamp()
        }, { merge: true });
        msg.textContent = "✅ Subscribed! Thanks for joining.";
        msg.className = 'ok';
        form.reset();
      } catch (err) {
        msg.textContent = "Something went wrong — please try again.";
        msg.className = 'err';
        console.error('Newsletter signup failed:', err);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBar);
  } else {
    injectBar();
  }
})();
