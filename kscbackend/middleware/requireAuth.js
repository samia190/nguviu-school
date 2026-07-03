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
    req.user = {
      ...payload,
      id: payload.id || payload._id,
      _id: payload._id || payload.id,
    };
    return next();
  } catch (err) {
    console.error("Auth error:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(allowed = []) {
  return function (req, res, next) {
    try {
      // allow arrays and single string
      const roles = Array.isArray(allowed) ? allowed : [allowed];
      const token = extractToken(req);
      
      if (!token) {
        console.log("No token provided for requireRole");
        return res.status(401).json({ error: "Unauthorized - no token" });
      }
      
      if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not configured!");
        return res.status(500).json({ error: "Server configuration error" });
      }
      
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!payload?.role) {
        console.log("No role in token payload");
        return res.status(403).json({ error: "Forbidden - no role" });
      }
      
      if (!roles.includes(payload.role)) {
        console.log("User role", payload.role, "not in allowed roles", roles);
        return res.status(403).json({ error: `Forbidden - requires role: ${roles.join(", ")}` });
      }
      
      req.user = {
        ...payload,
        id: payload.id || payload._id,
        _id: payload._id || payload.id,
      };
      return next();
    } catch (err) {
      console.error("Role check error:", err.message);
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token" });
      }
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

export default requireAuth;
