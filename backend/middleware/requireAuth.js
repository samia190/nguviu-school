import jwt from "jsonwebtoken";

function extractToken(req) {
  const auth = req.headers?.authorization;
  if (!auth) return null;
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return auth;
}

export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: "JWT_SECRET not configured" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(allowed = []) {
  return function (req, res, next) {
    try {
      // allow arrays and single string
      const roles = Array.isArray(allowed) ? allowed : [allowed];
      const token = extractToken(req);
      if (!token) return res.status(401).json({ error: "Unauthorized" });
      if (!process.env.JWT_SECRET) return res.status(500).json({ error: "JWT_SECRET not configured" });
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (!payload?.role) return res.status(403).json({ error: "Forbidden" });
      if (!roles.includes(payload.role)) return res.status(403).json({ error: "Forbidden" });
      req.user = payload;
      return next();
    } catch (err) {
      console.error("Role check error:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
