import { builtinModules } from "node:module";
import nextra from "nextra";

const nodeFallbacks = Object.fromEntries(
  builtinModules
    .filter((m) => !m.startsWith("_"))
    .flatMap((m) => [
      [m, false],
      [`node:${m}`, false],
    ]),
);

const withNextra = nextra({});

export default withNextra({
  output: "export",
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, options) => {
    if (!options.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ...nodeFallbacks,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "@vue/compiler-sfc": false,
      };
    }
    return config;
  },
  rewrites: async () => [
    {
      source: "/api",
      destination: "/api/index.html",
    },
    {
      source: "/chat",
      destination: "/chat/index.html",
    },
    {
      source: "/chat/shopping",
      destination: "/chat/shopping/index.html",
    },
  ],
});
