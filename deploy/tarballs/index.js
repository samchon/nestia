const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const packages = path.join(root, "packages");

const build = (name) => {
  // clear tgz files
  const packageDir = path.join(packages, name);
  for (const entry of fs.readdirSync(packageDir)) {
    if (entry.endsWith(".tgz")) {
      fs.rmSync(path.join(packageDir, entry), { force: true });
    }
  }

  console.log("Building package (tgz):", name);
  cp.execSync("pnpm pack", {
    stdio: "inherit",
    cwd: packageDir,
  });

  // copy tgz file
  const file = fs
    .readdirSync(packageDir)
    .find((f) => f.endsWith(".tgz"));
  fs.copyFileSync(
    path.join(packageDir, file),
    path.join(__dirname, `${name}.tgz`),
  );
};

const collect = () => {
  const records = fs
    .readdirSync(packages)
    .filter((name) => fs.statSync(path.join(packages, name)).isDirectory())
    .map((directory) => {
      const location = path.join(packages, directory, "package.json");
      const content = JSON.parse(fs.readFileSync(location, "utf8"));
      return {
        directory,
        name: content.name,
        dependencies: {
          ...content.dependencies,
          ...content.devDependencies,
          ...content.peerDependencies,
          ...content.optionalDependencies,
        },
      };
    });
  const names = new Map(records.map((r) => [r.name, r]));
  for (const record of records)
    record.workspaceDependencies = Object.entries(record.dependencies)
      .filter(([name, version]) => names.has(name) && isWorkspace(version))
      .map(([name]) => name)
      .sort();
  return { records, names };
};

const sort = () => {
  const { records, names } = collect();
  const output = [];
  const visiting = new Set();
  const visited = new Set();

  const visit = (record) => {
    if (visited.has(record.name)) return;
    if (visiting.has(record.name))
      throw new Error(`Circular workspace dependency: ${record.name}`);
    visiting.add(record.name);
    for (const name of record.workspaceDependencies) visit(names.get(name));
    visiting.delete(record.name);
    visited.add(record.name);
    output.push(record.directory);
  };

  for (const record of records.sort((a, b) => a.name.localeCompare(b.name)))
    visit(record);
  return output;
};

const isWorkspace = (value) =>
  typeof value === "string" && value.startsWith("workspace:");

// build packages
for (const directory of sort()) {
  build(directory);
}
