import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

const nextConfig = {
  ...withNextra(),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: "export",
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
