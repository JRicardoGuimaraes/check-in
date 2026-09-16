import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! AVISO !!
    // Isso permite que o build complete mesmo que
    // o TypeScript encontre erros de tipo.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
