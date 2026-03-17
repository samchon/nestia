import nextra from "nextra";
import { builtinModules } from "module";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

const nextraConfig = withNextra();
const nextraWebpack = nextraConfig.webpack;

const nodeFallbacks = Object.fromEntries(
  builtinModules
    .filter((m) => !m.startsWith("_"))
    .flatMap((m) => [
      [m, false],
      [`node:${m}`, false],
    ]),
);

const nextConfig = {
  ...nextraConfig,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: "export",
  webpack: (config, options) => {
    if (nextraWebpack) {
      config = nextraWebpack(config, options);
    }
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
};
export default nextConfig;
