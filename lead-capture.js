/* ════════════════════════════════════════════════════════════
   LEAD CAPTURE → CRM (Firestore "leads" collection)
   Every enquiry form on the site writes straight into the same
   Firestore project used by quotation-system.html, so new
   enquiries show up in the CRM's Leads tab automatically —
   no email/WhatsApp round-trip needed to know a lead came in.

   IMPORTANT: this requires a Firestore Security Rule that lets
   anyone (no login) create a new "leads" document. Without that
   rule this write will fail silently (permission-denied) and the
   form will still work normally via WhatsApp — it just won't
   reach the CRM until the rule is deployed.
════════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Website "Service Required" dropdown text → CRM's ld-ptype values.
// Falls back to the raw text if nothing matches (still shown fine in the CRM).
const PTYPE_MAP = {
  'Tin Shed Fabrication': 'Tin Shed',
  'Industrial Shed': 'Industrial Shed',
  'Prefab Warehouse': 'Prefab Warehouse',
  'PEB Structure': 'PEB Structure',
  'Prefab Factory Shed': 'Factory Shed',
  'Agricultural Shed': 'Agricultural Shed',
  'Other': 'Custom'
};

/**
 * Writes one enquiry into the CRM's "leads" collection.
 * Silently logs (does not throw) on failure so it never blocks
 * the WhatsApp/email flow that already works for the customer.
 */
window.pushLeadToFirestore = async function(data) {
  try {
    const notesParts = [];
    if (data.area) notesParts.push('Area: ' + data.area);
    if (data.message) notesParts.push(data.message);
    notesParts.push('(via ' + (data.pageSource || 'website') + ')');

    await addDoc(collection(db, 'leads'), {
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      addr: data.city || '',
      ptype: PTYPE_MAP[data.service] || data.service || 'Custom',
      source: 'Website',
      notes: notesParts.join(' — '),
      status: 'New',
      createdBy: null,
      branch: 'Delhi',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn('[lead-capture] Could not save lead to CRM (Firestore rules may need updating):', e.message);
    return false;
  }
};

/* ────────────────────────────────────────────────────────────
   window.handleEnquiry — used by the 5 pages whose forms call
   onsubmit="handleEnquiry(event)" (index, industrial-shed,
   peb-structure, prefab-warehouse, tin-shed). These forms only
   have a plain "cform" wrapper with no built-in success/error
   markup, so this builds that UI inline the first time it's needed.
──────────────────────────────────────────────────────────── */
const WHATSAPP_NUM = '918527258462';

function ensureFeedbackEls(form) {
  const wrap = form.parentNode; // append outside <form> so hiding the form doesn't hide these too
  let success = wrap.querySelector('.enq-success');
  let error   = wrap.querySelector('.enq-error');
  if (!success) {
    success = document.createElement('div');
    success.className = 'enq-success';
    success.style.cssText = 'display:none;background:rgba(37,211,102,.12);border:1.5px solid rgba(37,211,102,.4);border-radius:12px;padding:20px 18px;margin-top:16px;text-align:center';
    success.innerHTML = '<div style="font-size:32px;margin-bottom:8px">✅</div><div style="color:#25D366;font-weight:700;font-size:16px;margin-bottom:4px">Enquiry Sent Successfully!</div><div style="color:rgba(255,255,255,.65);font-size:13px;line-height:1.6">We have received it. Opening WhatsApp to confirm your details...</div>';
    wrap.appendChild(success);
  }
  if (!error) {
    error = document.createElement('div');
    error.className = 'enq-error';
    error.style.cssText = 'display:none;background:rgba(244,67,54,.12);border:1.5px solid rgba(244,67,54,.4);border-radius:12px;padding:16px 18px;margin-top:16px;text-align:center';
    error.innerHTML = '<div style="color:#f44336;font-weight:700;font-size:14px;margin-bottom:4px">⚠️ Something went wrong</div><div style="color:rgba(255,255,255,.65);font-size:13px">Please contact us directly on WhatsApp:</div><a href="https://api.whatsapp.com/send?phone=' + WHATSAPP_NUM + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;background:#25D366;color:white;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none">💬 WhatsApp Now</a>';
    wrap.appendChild(error);
  }
  return { success, error };
}

function showFieldError(form, fieldName, txt) {
  const inp = form.querySelector('[name="' + fieldName + '"]');
  if (!inp) return;
  inp.style.borderColor = '#f44336';
  inp.focus();
  let s = inp.parentNode.querySelector('.err-msg');
  if (!s) {
    s = document.createElement('span');
    s.className = 'err-msg';
    s.style.cssText = 'font-size:11px;color:#f44336;margin-top:3px;display:block';
    inp.parentNode.appendChild(s);
  }
  s.textContent = txt;
  setTimeout(() => { inp.style.borderColor = ''; s.textContent = ''; }, 3000);
}

window.handleEnquiry = async function(event) {
  event.preventDefault();
  const form = event.target;
  const gv = n => ((form.querySelector('[name="' + n + '"]') || {}).value || '').trim();

  const name = gv('name'), phone = gv('phone'), service = gv('service') || 'General Enquiry';
  const area = gv('area'), city = gv('city'), message = gv('message');

  if (!name) { showFieldError(form, 'name', 'Please enter your name'); return; }
  let phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length > 10) phoneDigits = phoneDigits.slice(-10); // strip leading 91/0 country-code prefix
  if (phoneDigits.length !== 10) { showFieldError(form, 'phone', 'Enter valid 10-digit number'); return; }

  const btn = form.querySelector('.submit-btn');
  const origTxt = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '⏳ Sending...'; btn.disabled = true; }

  const { success, error } = ensureFeedbackEls(form);
  success.style.display = 'none';
  error.style.display = 'none';

  // Save to CRM — never blocks the customer-facing flow if this fails.
  await window.pushLeadToFirestore({
    name, phone: phoneDigits, service, area, city, message,
    pageSource: document.title || location.pathname
  });

  form.style.display = 'none';
  success.style.display = 'block';

  const waLines = [
    'Hello R.R Teen Set Solution! 🏗️', '',
    '*New Website Enquiry*', '─'.repeat(16),
    'Name: ' + name,
    'Phone: ' + phone,
    'Service: ' + service,
    area ? 'Area: ' + area : '',
    city ? 'City: ' + city : '',
    message ? 'Message: ' + message : '', '',
    'Please call me. Thank you!'
  ].filter(Boolean).join('\n');

  setTimeout(() => {
    window.open('https://api.whatsapp.com/send?phone=' + WHATSAPP_NUM + '&text=' + encodeURIComponent(waLines), '_blank');
  }, 1200);

  if (btn) { btn.textContent = origTxt; btn.disabled = false; }
};
