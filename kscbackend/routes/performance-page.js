import express from "express";
import mongoose from "mongoose";
import PerformancePage, {
  defaultKcseResults,
  defaultHighlights,
} from "../models/PerformancePage.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

/**
 * Helper: Get or create default performance page document
 */
async function getOrCreatePerformancePage() {
  let page = await PerformancePage.findOne({});

  if (!page) {
    console.log("📝 Creating default PerformancePage document...");
    page = new PerformancePage({
      title: "School Performance",
      intro:
        "We are proud of our students' achievements and continually strive for academic excellence. Our performance reflects the dedication of our learners, teachers, and parents.",
      resultsHeading: "KCSE Performance Over the Years",
      achievementsHeading: "School Achievements",
      highlightsHeading: "Progress Highlights",
      reportsHeading: "Downloadable Reports",
      kcseResults: defaultKcseResults,
      achievements: [],
      highlights: defaultHighlights,
      reports: [],
    });
    await page.save();
    console.log("✅ Default PerformancePage created");
  }

  return page;
}

/**
 * GET /api/performance-page
 * Public endpoint — fetch performance page data
 */
router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn("⚠️ DB not connected, returning defaults");
      return res.json({
        title: "School Performance",
        intro: "We are proud of our students' achievements and continually strive for academic excellence.",
        resultsHeading: "KCSE Performance Over the Years",
        achievementsHeading: "School Achievements",
        highlightsHeading: "Progress Highlights",
        reportsHeading: "Downloadable Reports",
        kcseResults: defaultKcseResults,
        achievements: [],
        highlights: defaultHighlights,
        reports: [],
      });
    }

    const page = await getOrCreatePerformancePage();

    // For public: only return published achievements
    const publishedAchievements = (page.achievements || []).filter(
      (a) => a.published !== false
    );

    res.json({
      title: page.title,
      intro: page.intro,
      resultsHeading: page.resultsHeading,
      achievementsHeading: page.achievementsHeading,
      highlightsHeading: page.highlightsHeading,
      reportsHeading: page.reportsHeading,
      kcseResults: page.kcseResults || [],
      achievements: publishedAchievements,
      highlights: page.highlights || "",
      reports: page.reports || [],
    });
  } catch (err) {
    console.error("🔴 Error fetching performance page:", err);
    res.json({
      title: "School Performance",
      intro: "We are proud of our students' achievements.",
      kcseResults: defaultKcseResults,
      achievements: [],
      highlights: defaultHighlights,
      reports: [],
    });
  }
});

/**
 * GET /api/performance-page/admin
 * Protected — fetch full performance page data for admin editing
 */
router.get("/admin", requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const page = await getOrCreatePerformancePage();
    res.json(page.toObject ? page.toObject() : page);
  } catch (err) {
    console.error("🔴 Error fetching admin performance page:", err);
    res.status(500).json({ error: "Failed to fetch performance page data" });
  }
});

/**
 * PUT /api/performance-page
 * Protected — update performance page content
 */
router.put("/", requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const {
      title,
      intro,
      resultsHeading,
      achievementsHeading,
      highlightsHeading,
      reportsHeading,
      kcseResults,
      achievements,
      highlights,
      reports,
    } = req.body;

    let page = await getOrCreatePerformancePage();

    // Update only provided fields
    if (title !== undefined) page.title = title;
    if (intro !== undefined) page.intro = intro;
    if (resultsHeading !== undefined) page.resultsHeading = resultsHeading;
    if (achievementsHeading !== undefined) page.achievementsHeading = achievementsHeading;
    if (highlightsHeading !== undefined) page.highlightsHeading = highlightsHeading;
    if (reportsHeading !== undefined) page.reportsHeading = reportsHeading;
    if (kcseResults !== undefined) page.kcseResults = kcseResults;
    if (achievements !== undefined) page.achievements = achievements;
    if (highlights !== undefined) page.highlights = highlights;
    if (reports !== undefined) page.reports = reports;

    page.updatedAt = new Date();
    const updated = await page.save();

    console.log("✅ PerformancePage updated successfully");
    res.json(updated.toObject ? updated.toObject() : updated);
  } catch (err) {
    console.error("🔴 Error updating performance page:", err);
    res.status(400).json({ error: "Failed to update performance page: " + err.message });
  }
});

/**
 * POST /api/performance-page/reset-defaults
 * Admin only — reset to defaults
 */
router.post("/reset-defaults", requireAuth, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    await PerformancePage.deleteMany({});

    const page = new PerformancePage({
      title: "School Performance",
      intro:
        "We are proud of our students' achievements and continually strive for academic excellence. Our performance reflects the dedication of our learners, teachers, and parents.",
      resultsHeading: "KCSE Performance Over the Years",
      achievementsHeading: "School Achievements",
      highlightsHeading: "Progress Highlights",
      reportsHeading: "Downloadable Reports",
      kcseResults: defaultKcseResults,
      achievements: [],
      highlights: defaultHighlights,
      reports: [],
    });

    await page.save();
    console.log("✅ PerformancePage reset to defaults");
    res.json({ message: "Performance page reset to defaults", data: page.toObject() });
  } catch (err) {
    console.error("🔴 Error resetting performance page:", err);
    res.status(500).json({ error: "Failed to reset: " + err.message });
  }
});

export default router;
