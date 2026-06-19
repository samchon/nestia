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
  // `@nestia/editor` (and `@nestia/migrate`, pulled in through it) are only
  // loaded via `dynamic(..., { ssr: false })`, so they never run on the
  // server. Keep them external on the server compiler instead of bundling
  // their ESM `.mjs`, whose esm-shim banner imports `node:module`/`node:url`/
  // `node:path` — schemes the server bundler cannot resolve (UnhandledScheme).
  // The client compiler already maps `node:*` to `false` via `nodeFallbacks`.
  serverExternalPackages: ["@nestia/editor", "@nestia/migrate"],
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
