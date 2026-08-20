import express from "express";
import multer from "multer";
import BulkImport from "../models/BulkImport.js";
import { requireRole } from "../middleware/requireAuth.js";
import { createImportTemplate, createImportErrorReport, applyStagedImport, stageExcelImport } from "../services/bulkImportService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (req, file, callback) => callback(null, ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(file.mimetype) || /\.xlsx?$/i.test(file.originalname)) });
router.use(requireRole(["admin", "superadmin"]));

router.get("/templates/:type", async (req, res) => {
  const type = req.params.type;
  if (!["accounts", "results"].includes(type)) return res.status(400).json({ ok: false, error: "Unknown template type." });
  const buffer = await createImportTemplate(type);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="kangaru-${type}-template.xlsx"`);
  return res.send(Buffer.from(buffer));
});

router.post("/:type/preview", upload.single("file"), async (req, res) => {
  try {
    const type = req.params.type;
    if (!["accounts", "results"].includes(type) || !req.file) return res.status(400).json({ ok: false, error: "An Excel accounts or results file is required." });
    const record = await stageExcelImport({ buffer: req.file.buffer, sourceName: req.file.originalname, type, actor: req.user });
    return res.status(201).json({ ok: true, import: { id: record._id, type: record.type, status: record.status, summary: record.summary, rows: record.rows } });
  } catch (error) { return res.status(400).json({ ok: false, error: error.message || "Unable to validate the import." }); }
});

router.post("/:id/confirm", async (req, res) => {
  try {
    const record = await BulkImport.findById(req.params.id).lean();
    if (!record) return res.status(404).json({ ok: false, error: "Import not found." });
    if (record.type === "accounts" && req.user.role !== "superadmin" && record.rows.some((row) => row.data?.role === "admin")) return res.status(403).json({ ok: false, error: "Only a superadmin may provision administrator accounts." });
    const applied = await applyStagedImport({ importId: req.params.id, actor: req.user, publishResults: Boolean(req.body?.publishResults) });
    return res.json({ ok: true, import: { id: applied._id, status: applied.status, summary: applied.summary } });
  } catch (error) { return res.status(400).json({ ok: false, error: error.message || "Unable to apply import." }); }
});

router.get("/:id", async (req, res) => {
  const record = await BulkImport.findById(req.params.id).lean();
  if (!record) return res.status(404).json({ ok: false, error: "Import not found." });
  if (String(record.createdBy) !== String(req.user.id) && req.user.role !== "superadmin") return res.status(403).json({ ok: false, error: "Not authorized." });
  return res.json({ ok: true, import: record });
});

router.get("/:id/errors.xlsx", async (req, res) => {
  const record = await BulkImport.findById(req.params.id).lean();
  if (!record) return res.status(404).json({ ok: false, error: "Import not found." });
  if (String(record.createdBy) !== String(req.user.id) && req.user.role !== "superadmin") return res.status(403).json({ ok: false, error: "Not authorized." });
  const buffer = await createImportErrorReport(record);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="kangaru-${record.type}-import-errors.xlsx"`);
  return res.send(Buffer.from(buffer));
});

export default router;
