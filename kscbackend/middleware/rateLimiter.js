import rateLimit from "express-rate-limit";

// Rate limiter for authentication endpoints (login/register)
// 5 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: "Too many authentication attempts. Please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === "development";
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many authentication attempts. Please try again in 15 minutes."
    });
  }
});

// Rate limiter for student verification / parent token exchange
// 10 requests per 15 minutes per IP
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many verification attempts. Please try again in 15 minutes."
    });
  }
});

// Rate limiter for public contact/submission forms
// 5 submissions per 15 minutes per IP
export const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many form submissions. Please try again in 15 minutes."
    });
  }
});

export default authLimiter;
