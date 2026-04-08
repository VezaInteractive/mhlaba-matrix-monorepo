import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cesium's internal requestAnimationFrame render loop is incompatible with
  // React Strict Mode's intentional double-invocation of effects in development.
  // When Strict Mode tears down the effect, viewer.destroy() is called while
  // Cesium's RAF loop is still mid-render, crashing the credit/postRender pipeline.
  // This is the recommended fix per the Cesium and Resium documentation.
  reactStrictMode: false,
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
