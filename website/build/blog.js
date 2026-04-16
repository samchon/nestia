import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, "..", "src", "content", "blog");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "blog");
const SITE_URL = "https://nestia.io";
const SKIP_FILES = new Set(["index.mdx", "index.md"]);

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const parseFrontmatter = (content) => {
  const match = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const metadata = {};
  let currentKey = null;
  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const listMatch = rawLine.match(/^\s*-\s+(.*)$/);
    if (listMatch && currentKey && Array.isArray(metadata[currentKey])) {
      metadata[currentKey].push(listMatch[1].trim().replace(/^"|"$/g, ""));
      continue;
    }

    const keyValueMatch = rawLine.match(/^\s*([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyValueMatch) continue;

    const [, key, value] = keyValueMatch;
    if (value === "") {
      metadata[key] = [];
      currentKey = key;
    } else {
      metadata[key] = value.trim().replace(/^"|"$/g, "");
      currentKey = key;
    }
  }
  return metadata;
};

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
    const metadata = parseFrontmatter(source);
    const slug = file.replace(/\.mdx?$/, "");
    return {
      title: metadata.title ?? slug,
      description: metadata.description ?? "",
      date: metadata.date ?? new Date().toISOString().slice(0, 10),
      slug,
    };
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Nestia Blog</title>
    <link>${SITE_URL}/blog/</link>
    <description>Engineering notes, releases, and practical backend workflow articles from Nestia.</description>
    <language>en</language>
${posts
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}/</link>
      <guid>${SITE_URL}/blog/${post.slug}/</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUTPUT_DIR, "rss.xml"), xml);
