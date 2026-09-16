#!/usr/bin/env node
"use strict";

// Copies the repository README into every `packages/*` directory once, right
// before publishing or packing. Each `packages/*/README.md` is gitignored, so
// a fresh checkout (CI included) has none until this runs.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const source = path.join(root, "README.md");
const packages = path.join(root, "packages");

for (const name of fs.readdirSync(packages)) {
  const directory = path.join(packages, name);
  if (!fs.statSync(directory).isDirectory()) continue;
  if (!fs.existsSync(path.join(directory, "package.json"))) continue;
  fs.copyFileSync(source, path.join(directory, "README.md"));
}
