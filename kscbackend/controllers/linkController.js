// controllers/linkController.js (ESM)
import GeneratedLink from "../models/GeneratedLink.js";
import LinkAnalytic from "../models/LinkAnalytic.js";
import User from "../models/User.js";
import crypto from "crypto";

// Generate a unique short code
const generateShortCode = async (alphabet = "abcdefghijklmnopqrstuvwxyz0123456789") => {
  const customAlphabet = alphabet;
  const length = parseInt(process.env.SHORT_LINK_LENGTH || "6");

  let code;
  let exists = true;

  while (exists) {
    code = "";
    for (let i = 0; i < length; i++) {
      code += customAlphabet[Math.floor(Math.random() * customAlphabet.length)];
    }
    exists = await GeneratedLink.findOne({ shortCode: code });
  }

  return code;
};

// Create a new short link
export const createLink = async (req, res) => {
  try {
    const { originalUrl, title, description, tags, password, maxAccesses, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ ok: false, error: "originalUrl is required" });
    }

    const shortCode = await generateShortCode();
    let hashedPassword = null;

    if (password) {
      hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    }

    const link = new GeneratedLink({
      shortCode,
      originalUrl,
      title,
      description,
      tags: tags || [],
      createdBy: req.user._id,
      password: hashedPassword,
      maxAccesses,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `${process.env.PUBLIC_ORIGIN || "http://localhost:4000"}/s/${shortCode}`
      )}`,
    });

    await link.save();

    res.status(201).json({ ok: true, link });
  } catch (error) {
    console.error("Error creating link:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get all links for user
export const getUserLinks = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const links = await GeneratedLink.find({ createdBy: req.user._id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select("-password");

    const total = await GeneratedLink.countDocuments({ createdBy: req.user._id });

    res.json({ ok: true, links, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get link by short code (public endpoint)
export const resolveLinkByCode = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await GeneratedLink.findOne({ shortCode, isActive: true });

    if (!link) {
      return res.status(404).json({ ok: false, error: "Link not found" });
    }

    // Check if expired
    if (link.expiresAt && new Date() > link.expiresAt) {
      link.isExpired = true;
      await link.save();
      return res.status(410).json({ ok: false, error: "Link has expired" });
    }

    // Check max accesses
    if (link.maxAccesses && link.accessCount >= link.maxAccesses) {
      return res.status(410).json({ ok: false, error: "Link access limit reached" });
    }

    // Check password if required
    if (link.password && req.body.password) {
      const hashedPassword = crypto.createHash("sha256").update(req.body.password).digest("hex");
      if (hashedPassword !== link.password) {
        return res.status(401).json({ ok: false, error: "Invalid password" });
      }
    } else if (link.password && !req.body.password) {
      return res.status(401).json({ ok: false, error: "Password required" });
    }

    // Update access count
    link.accessCount += 1;
    link.lastAccessedAt = new Date();
    await link.save();

    // Track analytics
    const analytic = new LinkAnalytic({
      linkId: link._id,
      visitorIp: req.ip,
      timestamp: new Date(),
      referrer: req.get("referrer") || "direct",
      userAgent: req.get("user-agent"),
      wasSuccessful: true,
      passwordRequired: !!link.password,
      passwordCorrect: !!req.body.password,
    });

    await analytic.save();

    // Redirect or return URL
    if (req.query.redirect === "false") {
      return res.json({ ok: true, originalUrl: link.originalUrl });
    }

    res.redirect(link.originalUrl);
  } catch (error) {
    console.error("Error resolving link:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Update link
export const updateLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const updates = req.body;

    const link = await GeneratedLink.findById(linkId);
    if (!link) return res.status(404).json({ ok: false, error: "Link not found" });

    // Only creator can update
    if (link.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    Object.assign(link, updates);
    await link.save();

    res.json({ ok: true, link });
  } catch (error) {
    console.error("Error updating link:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Delete link
export const deleteLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await GeneratedLink.findById(linkId);
    if (!link) return res.status(404).json({ ok: false, error: "Link not found" });

    if (link.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    // Delete analytics
    await LinkAnalytic.deleteMany({ linkId });
    await GeneratedLink.findByIdAndDelete(linkId);

    res.json({ ok: true, message: "Link deleted successfully" });
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get analytics for a link
export const getLinkAnalytics = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { days = 30 } = req.query;

    const link = await GeneratedLink.findById(linkId);
    if (!link) return res.status(404).json({ ok: false, error: "Link not found" });

    if (link.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await LinkAnalytic.find({
      linkId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 });

    // Calculate summary statistics
    const summary = {
      totalClicks: link.accessCount,
      uniqueVisitors: await LinkAnalytic.distinct("visitorIp", { linkId }),
      avgClicksPerDay: Math.round(link.accessCount / parseInt(days)),
      lastAccessed: link.lastAccessedAt,
      topReferrers: [],
      topCountries: [],
      deviceTypes: {},
    };

    // Group by device type
    const deviceGroups = {};
    analytics.forEach((a) => {
      if (a.deviceType) {
        deviceGroups[a.deviceType] = (deviceGroups[a.deviceType] || 0) + 1;
      }
    });
    summary.deviceTypes = deviceGroups;

    res.json({ ok: true, analytics, summary });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Get top links for user
export const getTopLinks = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const links = await GeneratedLink.find({ createdBy: req.user._id })
      .sort({ accessCount: -1 })
      .limit(parseInt(limit))
      .select("-password");

    res.json({ ok: true, links });
  } catch (error) {
    console.error("Error fetching top links:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Disable/enable link
export const toggleLinkStatus = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await GeneratedLink.findById(linkId);
    if (!link) return res.status(404).json({ ok: false, error: "Link not found" });

    if (link.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    link.isActive = !link.isActive;
    await link.save();

    res.json({ ok: true, link });
  } catch (error) {
    console.error("Error toggling link status:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
