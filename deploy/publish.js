const cp = require("child_process");
const fs = require("fs");
const { build } = require("./build");

const packages = ["fetcher", "core", "sdk"];

const execute = ({ cwd, script, studio }) => {
  console.log(script);
  cp.execSync(script, {
    cwd: cwd,
    stdio: studio ?? "ignore",
  });
};

const setup = ({ tag, version, directory }) => {
  // CHANGE PACKAGE.JSON INFO
  const file = `${directory}/package.json`;
  const info = JSON.parse(fs.readFileSync(file, "utf8"));
  info.version = version;

  // SET DEPENDENCIES
  const rollbacks = [];
  for (const record of [info.dependencies ?? {}, info.devDependencies ?? {}])
    for (const key of Object.keys(record))
      if (
        key.startsWith("@nestia") &&
        packages.includes(key.replace("@nestia/", ""))
      ) {
        record[key] = `^${version}`;
        rollbacks.push(() => (record[key] = `workspace:^`));
      }
  for (const key of Object.keys(info.peerDependencies ?? {}))
    if (
      key.startsWith("@nestia") &&
      packages.includes(key.replace("@nestia/", ""))
    )
      info.peerDependencies[key] = `>=${version}`;

  // DO PUBLISH
  fs.writeFileSync(file, JSON.stringify(info, null, 2), "utf8");
  if (fs.existsSync(`${directory}/package-lock.json`))
    fs.rmSync(`${directory}/package-lock.json`);
  execute({
    cwd: directory,
    script: `npm publish --tag ${tag} --access public`,
    studio: "inherit",
  });

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
    directory,
  });
  console.log("");
};

const publish = async (tag) => {
  // GET VERSION
  const version = (() => {
    const content = fs.readFileSync(`${__dirname}/../package.json`, "utf8");
    const info = JSON.parse(content);
    return info.version;
  })();

  // VALIDATE TAG
  const dev = version.includes("-dev.") === true;
  if (tag === "next" && dev === false)
    throw new Error(`${tag} tag can only be used for dev versions.`);
  else if (tag === "latest" && dev === true)
    throw new Error(`latest tag can only be used for non-dev versions.`);

  // BUILD FIRST
  await build();

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
    });
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
};

module.exports = { publish };
