/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
  },
  async redirects() {
    return [{ source: '/', destination: '/dashboard', permanent: false }]
  },
}

module.exports = nextConfig
