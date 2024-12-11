const cp = require("child_process");

const { build } = require("./build");
const { publish } = require("./publish");

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

const migrate = async ({ tag, version }) => {
  await build(["migrate", "editor"]);
  await publish({
    tag,
    packages: ["migrate", "editor"],
    version,
  });
  await website();
};
module.exports = { migrate };
