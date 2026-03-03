/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@blocknote/core", "@blocknote/react", "@blocknote/mantine"],
  env: {
    NEXT_PUBLIC_DOCS_API_URL: process.env.NEXT_PUBLIC_DOCS_API_URL ?? "http://localhost:8071/api/v1.0",
    NEXT_PUBLIC_DOCS_FRONTEND_URL: process.env.NEXT_PUBLIC_DOCS_FRONTEND_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_FORMS_API_URL: process.env.NEXT_PUBLIC_FORMS_API_URL ?? "http://localhost:8080",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  },
};

export default nextConfig;
