/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config, { isServer }) => {
    // Resolver problemas con undici y private fields
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };

    // Excluir undici del bundle del cliente
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
    }

    return config;
  },
  transpilePackages: ['undici'],
}

export default nextConfig
