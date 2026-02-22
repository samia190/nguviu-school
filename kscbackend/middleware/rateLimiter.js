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

export default authLimiter;
