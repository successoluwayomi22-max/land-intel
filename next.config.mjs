/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    useWasmBinary: true,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://accounts.google.com https://js.paystack.co https://checkout.paystack.com; style-src 'self' 'unsafe-inline' https://translate.googleapis.com https://translate.google.com https://www.gstatic.com https://fonts.googleapis.com; img-src 'self' blob: data: https: http: https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://www.google.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss: https://translate.googleapis.com https://translate-pa.googleapis.com https://translate.google.com https://maps.googleapis.com; frame-src 'self' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://checkout.paystack.com https://www.google.com https://recaptcha.google.com https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;",
        },
      ],
    },
  ],
  rewrites: async () => [
    {
      source: '/dashboard/properties',
      destination: '/properties',
    },
    {
      source: '/dashboard/properties/:path*',
      destination: '/properties/:path*',
    },
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
