import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data/content.json");

export function loadContent() {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

export function saveContent(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}
exports.deleteMedia = async (req, res) => {
  const { contentId, mediaId } = req.params;

  const content = await Content.findById(contentId);
  if (!content) return res.status(404).json({ error: "Content not found" });

  const media = content.attachments.id(mediaId);
  if (!media) return res.status(404).json({ error: "Media not found" });

  // OPTIONAL: delete physical file here
  // fs.unlinkSync(media.url)

  media.remove();
  await content.save();

  res.json({ success: true });
};

exports.replaceMedia = async (req, res) => {
  const { contentId, mediaId } = req.params;

  const content = await Content.findById(contentId);
  if (!content) return res.status(404).json({ error: "Content not found" });

  const media = content.attachments.id(mediaId);
  if (!media) return res.status(404).json({ error: "Media not found" });

  media.url = req.file.path;
  media.originalName = req.file.originalname;
  media.mimetype = req.file.mimetype;
  media.size = req.file.size;

  await content.save();
  res.json({ success: true });
};

