/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => "randochat-" + Date.now().toString(36),
};
module.exports = nextConfig;
