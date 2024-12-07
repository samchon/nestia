const cp = require("child_process");

const { build } = require("./build");
const { publish } = require("./publish");

const { version: stationVersion } = require("../package.json");
const { version: migrateVersion } = require("../packages/migrate/package.json");
const { version: editorVersion } = require("../packages/editor/package.json");

const website = async () => {
  console.log("=========================================");
  console.log(` Publish @nestia/website`);
  console.log("=========================================");

  for (const script of ["npm install", "npm run build"])
    cp.execSync(script, {
      cwd: `${__dirname}/../website`,
      stdio: "inherit",
    });
};

const migrate = async (tag) => {
  await build(["migrate", "editor"]);
  await publish({
    tag,
    packages: ["migrate", "editor"],
    version: (name) =>
      name === "migrate"
        ? migrateVersion
        : name === "editor"
          ? editorVersion
          : ["fetcher", "core", "sdk"].includes(name)
            ? stationVersion
            : null,
  });
  await website();
};
module.exports = { migrate };
