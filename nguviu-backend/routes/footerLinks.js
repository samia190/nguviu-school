// routes/footerLinks.js
import express from 'express';
const router = express.Router();

// Sample footer links data
const footerLinks = {
  contact: {
    title: "Contact",
    details: [
      { label: "Nguviu Girls' Senior School", value: "P.O Box 12, 60100 EMBU" },
      { label: "Phone", value: "0113688538" },
      { label: "Email", value: "nguviugirls@yahoo.com" }
    ]
  },
  quickLinks: {
    title: "Quick Links",
    links: [
      { title: "Home", url: "/" },
      { title: "About Us", url: "/about" },
      { title: "Admissions", url: "/admissions" },
      { title: "Curriculum", url: "/curriculum" },
      { title: "Gallery", url: "/gallery" },
      { title: "Contact", url: "/contact" }
    ]
  },
  portals: {
    title: "Portals",
    links: [
      { title: "Student Portal", url: "/student-portal" },
      { title: "Staff Portal", url: "/staff-portal" },
      { title: "Homework Portal", url: "/homework-portal" },
      { title: "Application Portal", url: "/application-portal" }
    ]
  },
  academics: {
    title: "Academics",
    links: [
      { title: "Curriculum Overview", url: "/curriculum-overview" },
      { title: "Subjects", url: "/subjects" },
      { title: "Examinations", url: "/examinations" },
      { title: "Clubs & Societies", url: "/clubs-and-societies" },
      { title: "Guidance & Counseling", url: "/guidance-and-counseling" }
    ]
  }
};

// Define the GET route for /api/footer-links
router.get('/', (req, res) => {
  res.json(footerLinks);
});

export default router;
