/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "fontkit", "restructure", "iconv-lite", "pdf-parse"],
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
