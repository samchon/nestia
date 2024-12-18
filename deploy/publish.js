const cp = require("child_process");
const fs = require("fs");

const execute = ({ cwd, script, studio }) => {
  console.log(script);
  cp.execSync(script, {
    cwd: cwd,
    stdio: studio ?? "ignore",
  });
};

const setup = ({ tag, name, directory, version }) => {
  // CHANGE PACKAGE.JSON INFO
  const file = `${directory}/package.json`;
  const info = JSON.parse(fs.readFileSync(file, "utf8"));
  info.version = version(name);

  // SET DEPENDENCIES
  const rollbacks = [];
  if (info.dependencies)
    for (const key of Object.keys(info.dependencies)) {
      if (key.startsWith("@nestia") && !!version(key.replace("@nestia/", ""))) {
        info.dependencies[key] = `^${version(key.replace("@nestia/", ""))}`;
        rollbacks.push(() => (info.dependencies[key] = `workspace:^`));
      }
    }
  for (const key of Object.keys(info.peerDependencies ?? {}))
    if (key.startsWith("@nestia") && !!version(key.replace("@nestia/", "")))
      info.peerDependencies[key] = `>=${version(key.replace("@nestia/", ""))}`;

  // DO PUBLISH
  fs.writeFileSync(file, JSON.stringify(info, null, 2), "utf8");
  if (fs.existsSync(`${directory}/package-lock.json`))
    fs.rmSync(`${directory}/package-lock.json`);
  try {
    execute({
      cwd: directory,
      script: `npm publish --tag ${tag} --access public${tag === "latest" ? " --provenance" : ""}`,
      studio: "inherit",
    });
  } catch {}

  // ROLLBACK THE PACKAGE.JSON
  for (const r of rollbacks) r();
  fs.writeFileSync(file, JSON.stringify(info, null, 2), "utf8");
};

const deploy = ({ tag, version, name }) => {
  console.log("=========================================");
  console.log(` Publish @nestia/${name}`);
  console.log("=========================================");

  // SETUP
  const directory = `${__dirname}/../packages/${name}`;
  fs.copyFileSync(`${__dirname}/../README.md`, `${directory}/README.md`);
  setup({
    tag,
    version,
    name,
    directory,
  });
  console.log("");
};

const publish = async ({ tag, packages, version }) => {
  // VALIDATE TAG
  const dev = version(packages[0])?.includes("-dev.");
  if (dev === undefined)
    throw new Error("Invalid package version. Please check the package.json.");
  else if (tag === "next" && dev === false)
    throw new Error(`${tag} tag can only be used for dev versions.`);
  else if (tag === "latest" && dev === true)
    throw new Error(`latest tag can only be used for non-dev versions.`);

  // DO DEPLOY
  const skip = (() => {
    const index = process.argv.indexOf("--skip");
    if (index === -1) return [];

    const targets = process.argv.slice(index + 1);
    return targets.filter((t) => packages.includes(t));
  })();
  for (const pack of packages) {
    if (skip.includes(pack)) continue;
    deploy({
      tag,
      version,
      name: pack,
      version,
    });
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
};

module.exports = { publish };
