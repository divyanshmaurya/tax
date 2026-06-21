import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the blank IRS form (read from disk at runtime by /api/form8843) is
  // bundled into that route's serverless function on Vercel. Without this,
  // serverless file tracing can omit public/ assets and the PDF route 500s.
  outputFileTracingIncludes: {
    "/api/form8843": ["./public/forms/*.pdf"],
  },
};

export default nextConfig;
