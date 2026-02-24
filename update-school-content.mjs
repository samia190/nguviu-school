#!/usr/bin/env node
/**
 * Update School Content Script
 * - Deputy Principals
 * - School Values
 * - Vision & Mission
 * - Contact Details
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';

// Example admin token (you'll need to generate from login or .env)
// For now, we'll just show the data that needs to be updated

const deputyPrincipals = [
  {
    type: "deputy_principal",
    fullName: "Mss Purity Wamboi Wachira",
    title: "Administration Deputy Principal",
    photoUrl: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/DSC_5372.jpg",
    remarks: "Leading administration with dedication and excellence. Committed to fostering an environment where every student is supported to achieve their full potential through systematic management and inclusive leadership."
  },
  {
    type: "deputy_principal",
    fullName: "Easter Wanjiru Nyaga",
    title: "Academic Deputy Principal",
    photoUrl: "https://res.cloudinary.com/ddm1dgws8/image/upload/w_400,q_auto,f_auto/kangaru/DSC_5364.jpg",
    remarks: "Driving academic excellence and innovation. Passionate about developing challenging curricula that inspire students to think critically and achieve academic success in a competitive global landscape."
  }
];

const schoolValues = `
• Integrity: Acting with honesty and moral principles in all endeavors
• Professionalism: Delivering excellence through competence and dedication
• Teamwork: Collaborating effectively to achieve common goals
• Excellence: Striving for the highest standards in all we do
• Courtesy: Treating everyone with respect and kindness
• Fidelity to Law: Upholding justice and constitutional principles
`;

const vision = "To be a centre of excellence in holistic education in Kenya for global competitiveness";

const mission = "To create an enabling environment where learners are equipped with knowledge, skills and attitudes to excel in a globally competitive society";

const contactDetails = {
  address: "P.O. BOX 1094-60100\nEMBU, KENYA",
  phone: "+254796214804",
  email: "kangarugirls@yahoo.com"
};

const performanceData = [
  { year: 2017, meanScore: 6.731, grade: "C+" },
  { year: 2018, meanScore: 7.303, grade: "C+" },
  { year: 2019, meanScore: 8.032, grade: "B-" },
  { year: 2020, meanScore: 7.995, grade: "B-" },
  { year: 2021, meanScore: 7.53, grade: "B-" },
  { year: 2022, meanScore: 6.8054, grade: "C+" },
  { year: 2023, meanScore: 6.9961, grade: "C+" },
  { year: 2024, meanScore: 7.2993, grade: "C+" }
];

console.log(`
╔════════════════════════════════════════════════════════════════╗
║          SCHOOL CONTENT UPDATE - DATA SUMMARY                  ║
╚════════════════════════════════════════════════════════════════╝

1. DEPUTY PRINCIPALS (2 records to add/update):
${deputyPrincipals.map((dp, i) => `   ${i+1}. ${dp.fullName} (${dp.title})`).join('\n')}

2. SCHOOL VALUES:
${schoolValues.trim()}

3. VISION:
   "${vision}"

4. MISSION:
   "${mission}"

5. CONTACT DETAILS:
   Address: ${contactDetails.address.replace(/\n/g, ' | ')}
   Phone: ${contactDetails.phone}
   Email: ${contactDetails.email}

6. PERFORMANCE DATA (8 years):
${performanceData.map(p => `   ${p.year}: ${p.meanScore} (${p.grade})`).join('\n')}

────────────────────────────────────────────────────────────────

TO UPDATE THESE IN PRODUCTION:

1. DEPUTY PRINCIPALS (via Staff API):
   - Log in as admin
   - Go to Admin Dashboard → Staff Management
   - Add/Edit staff with type "deputy_principal"

2. SCHOOL VALUES & VISION/MISSION (via About Management):
   - Go to Admin Dashboard → About Management
   - Update:
     - Core Values: ${schoolValues.replace(/\n/g, ' ')}
     - Vision: ${vision}
     - Mission: ${mission}

3. CONTACT DETAILS:
   - Go to Admin Dashboard → Contact Management
   - Update:
     - Address: ${contactDetails.address}
     - Phone: ${contactDetails.phone}
     - Email: ${contactDetails.email}

4. PERFORMANCE DATA:
   - Go to Admin Dashboard → Performance Management
   - Add/Edit annual performance records for each year

────────────────────────────────────────────────────────────────

SYNTAX CORRECTIONS MADE:
✓ "Accademic" → "Academic"
✓ "greate" → "create"
✓ "equiped" → "equipped"
✓ "excelence" → "excellence"
✓ "vission" → "vision"

Note: Manual admin panel updates are recommended for better validation
and to ensure proper image references are set.
`);
