/** @type {import('next-sitemap').IConfig} */
const sitemapConfig = {
  siteUrl: "https://nestia.io",
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  exclude: [
    "/docs/migrate",
    "/docs/editor",
    "/docs/sdk/sdk",
    "/docs/sdk/swagger",
    "/docs/sdk/simulator",
  ],
  transform: async (config, url) => ({
    loc: url,
    changefreq: url === "/" ? "daily" : "weekly",
    priority:
      url === "/" ? 1.0 : url.startsWith("/docs") ? 0.8 : 0.6,
    lastmod: new Date().toISOString(),
  }),
};
export default sitemapConfig;
