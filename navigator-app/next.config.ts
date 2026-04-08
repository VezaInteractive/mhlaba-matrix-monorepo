import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Externalize cesium to just use the global window.Cesium script injected in layout
    if (!config.externals) {
      config.externals = [];
    }
    config.externals.push({
      cesium: "Cesium"
    });

    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            https: false,
            zlib: false,
            http: false,
            url: false,
        };
    }
    
    return config;
  },
  turbopack: {},
};

export default nextConfig;
