const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

const nextConfig = {
  ...withNextra(),
  exportTrailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: "export",
  rewrites: async () => [
    {
      source: "/api",
      destination: "/api/index.html",
    },
  ],
};
module.exports = nextConfig;
