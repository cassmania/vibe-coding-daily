/** @type {import('next').NextConfig} */
const isPages = process.env.GITHUB_PAGES === "true";
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  basePath: isPages ? "/vibe-coding-daily" : "",
  assetPrefix: isPages ? "/vibe-coding-daily/" : undefined,
};
export default nextConfig;
