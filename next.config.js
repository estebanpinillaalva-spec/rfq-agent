/** @type {import('next').NextConfig} */
const nextConfig = {
  // Necesario para Puppeteer en Vercel
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
}

module.exports = nextConfig
