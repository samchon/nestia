import fs from "fs";
import matter from "gray-matter";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, "..", "src", "content", "blog");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "blog");
const SITE_URL = process.env.SITE_URL ?? "https://nestia.io";
const SKIP_FILES = new Set(["index.mdx", "index.md"]);

const escapeXml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const posts = fs
  .readdirSync(CONTENT_DIR)
  .filter(
    (file) =>
      !SKIP_FILES.has(file) &&
      !file.startsWith("_") &&
      (file.endsWith(".md") || file.endsWith(".mdx")),
  )
  .map((file) => {
    const fullPath = path.join(CONTENT_DIR, file);
    const source = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(source);
    if (data.draft === true) return null;
    const slug = file.replace(/\.mdx?$/, "");
    return {
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? new Date().toISOString().slice(0, 10),
      author: data.author ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      slug,
    };
  })
  .filter(Boolean)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const buildDate = new Date().toUTCString();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nestia Blog</title>
    <link>${SITE_URL}/blog/</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Engineering notes, releases, and practical backend workflow articles from Nestia.</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${posts
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}/</link>
      <guid>${SITE_URL}/blog/${post.slug}/</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>${
        post.author
          ? `\n      <author>${escapeXml(post.author)}</author>`
          : ""
      }
      <description>${escapeXml(post.description)}</description>${post.tags
        .map((tag) => `\n      <category>${escapeXml(tag)}</category>`)
        .join("")}
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, "rss.xml"), xml);
