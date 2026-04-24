/** @type {import('next').NextConfig} */
// Next.js already exposes NEXT_PUBLIC_* vars to the client; no need to
// re-declare them here. The prior inlined fallbacks hardcoded a live key
// that ended up in a public repo. Keeping env lookups implicit forces the
// deployment environment to set the value.
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
}

module.exports = nextConfig
