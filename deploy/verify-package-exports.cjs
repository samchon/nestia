const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const requireMain = args.includes("--require-main");
const directory =
  args.find((arg) => !arg.startsWith("--")) ?? process.cwd();
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

if (requireMain && typeof pack.main === "string") {
  try {
    require(path.resolve(directory, pack.main));
  } catch (error) {
    failures.push(`main is not require-able: ${error.message}`);
  }
}

if (failures.length !== 0) {
  console.error(`Invalid package exports for ${pack.name}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
