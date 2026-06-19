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
  // their browser-oriented ESM `.mjs` there. The client compiler still bundles
  // them; the `node:`-scheme imports their esm-shim banner carries are handled
  // by the webpack rewrite below.
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
      // `@nestia/migrate`'s `.mjs` carries an esm-shim banner that imports
      // `node:module`/`node:url`/`node:path`. webpack intercepts the `node:`
      // scheme before module resolution, so the `node:*` entries in
      // `resolve.fallback` never apply and the client build dies with
      // `UnhandledSchemeError`. Rewrite the requests to their bare names so
      // the (working) bare `resolve.fallback` entries map them to `false`.
      config.plugins.push(
        new options.webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, "");
          },
        ),
      );
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
