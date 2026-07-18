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
    // The tutorial is the entry path for a new reader, so it ranks with the
    // guides rather than falling to the catch-all now that it is no longer
    // nested under `/docs`.
    priority:
      url === "/"
        ? 1.0
        : url.startsWith("/docs") || url.startsWith("/tutorial")
          ? 0.8
          : 0.6,
    lastmod: new Date().toISOString(),
  }),
};
export default sitemapConfig;
