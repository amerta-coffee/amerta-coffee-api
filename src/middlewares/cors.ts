import { cors } from "hono/cors";

const corsMiddleware = cors({
  origin: (origin) => {
    const allowedOrigins = process.env.CORS_ALLOWS_ORIGINS?.split(",") || [];
    if (origin) {
      const validOrigin = allowedOrigins.some((allowedOrigin) => {
        return (
          origin === `http://${allowedOrigin}` ||
          origin === `https://${allowedOrigin}`
        );
      });

      if (validOrigin) {
        return origin;
      }
    }
    return null;
  },
  credentials: true,
  maxAge: 3600,
});

export default corsMiddleware;
