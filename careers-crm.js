/* ════════════════════════════════════════════════════════════
   CAREERS → CRM (Firestore "jobApplications" collection)
   Every application submitted on careers.html writes into the same
   Firestore project used by quotation-system.html, so HR/the owner
   can see every applicant (name, phone, role, experience, city) in
   the CRM's "Careers" tab and call them back later — without relying
   on WhatsApp messages getting lost in chat.

   This is kept in its OWN collection ("jobApplications"), separate
   from "leads" ("leads" = sales enquiries for shed/PEB work), so the
   two never mix in reporting.

   IMPORTANT: this requires a Firestore Security Rule that lets
   anyone (no login) create a new "jobApplications" document — same
   as the existing rule for "leads" and "testimonials". Without that
   rule this write fails silently (permission-denied) and the
   careers form still works normally via WhatsApp; it just won't
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

/**
 * Writes one job application into the CRM's "jobApplications" collection.
 * Silently logs (does not throw) on failure so it never blocks the
 * WhatsApp flow that already works for the applicant.
 */
window.pushApplicantToCRM = async function (data) {
  try {
    await addDoc(collection(db, 'jobApplications'), {
      name: data.name || '',
      phone: data.phone || '',
      role: data.role || '',
      experience: data.experience || '',
      city: data.city || '',
      message: data.message || '',
      source: 'Website — Careers Page',
      status: 'New',
      branch: 'Delhi',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn('[careers-crm] Could not save application to CRM (Firestore rules may need updating):', e.message);
    return false;
  }
};
