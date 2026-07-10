const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const args = process.argv.slice(2);
const requireMain = args.includes("--require-main");
// --esm: dynamic-import lib/index.mjs and assert named-export parity with the
// CJS main. --esm-static: filesystem-only ESM checks, for packages whose deep
// dependency graph cannot load in bare Node (browser-only externals).
const esm = args.includes("--esm");
const esmStatic = args.includes("--esm-static") || esm;
const directory = args.find((arg) => !arg.startsWith("--")) ?? process.cwd();
const pack = JSON.parse(
  fs.readFileSync(path.join(directory, "package.json"), "utf8"),
);

const failures = [];

const check = (label, value) => {
  if (typeof value !== "string") return;
  if (value.includes("*")) return;
  if (value.startsWith(".") === false && value.startsWith("lib/") === false)
    return;
  const file = path.resolve(directory, value);
  if (fs.existsSync(file) === false)
    failures.push(`${label} points to missing file: ${value}`);
};

const visitExports = (label, value) => {
  if (typeof value === "string") check(label, value);
  else if (value && typeof value === "object")
    for (const [key, next] of Object.entries(value))
      visitExports(`${label}.${key}`, next);
};

check("main", pack.main);
check("types", pack.types ?? pack.typings);
if (typeof pack.bin === "string") check("bin", pack.bin);
else if (pack.bin && typeof pack.bin === "object")
  for (const [key, value] of Object.entries(pack.bin))
    check(`bin.${key}`, value);
visitExports("exports", pack.exports);
if (esmStatic && pack.publishConfig) {
  check("publishConfig.main", pack.publishConfig.main);
  check("publishConfig.module", pack.publishConfig.module);
  visitExports("publishConfig.exports", pack.publishConfig.exports);
}

if (requireMain && typeof pack.main === "string") {
  try {
    require(path.resolve(directory, pack.main));
  } catch (error) {
    failures.push(`main is not require-able: ${error.message}`);
  }
}

// A broken CJS->ESM transcode leaves facade duplicates (`Foo2.mjs` next to
// `Foo.mjs`) behind. Fail the build on any of them so a regression can never
// ship silently.
if (esmStatic) {
  const walk = (location) => {
    for (const entry of fs.readdirSync(location, { withFileTypes: true })) {
      const next = path.join(location, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (/2\.mjs$/.test(entry.name)) {
        const twin = path.join(location, entry.name.replace(/2\.mjs$/, ".mjs"));
        if (fs.existsSync(twin)) failures.push(`ESM facade duplicate: ${next}`);
      }
    }
  };
  const lib = path.resolve(directory, "lib");
  if (fs.existsSync(lib)) walk(lib);
  else failures.push("lib directory is missing");
}

const finish = () => {
  if (failures.length !== 0) {
    console.error(`Invalid package exports for ${pack.name}:`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
};

if (esm && typeof pack.main === "string") {
  (async () => {
    try {
      const cjs = require(path.resolve(directory, pack.main));
      const mjs = path.resolve(directory, pack.main.replace(/\.js$/, ".mjs"));
      const namespace = await import(pathToFileURL(mjs).href);
      for (const key of Object.keys(cjs))
        if (key !== "default" && key !== "__esModule" && !(key in namespace))
          failures.push(`ESM build lost named export: ${key}`);
    } catch (error) {
      failures.push(`ESM main is not import-able: ${error.message}`);
    }
    finish();
  })();
} else finish();
