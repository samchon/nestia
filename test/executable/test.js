const cp = require("child_process");
const fs = require("fs");

const directory = fs.readdirSync(`${__dirname}/../features`);
for (const feature of directory) {
  const location = `${__dirname}/../features/${feature}`;
  if (feature.includes("error")) continue;
  else if (fs.existsSync(`${location}/src/test`) === false) continue;

  console.log(`Testing ${feature}`);
  cp.execSync(`npx ts-node src/test`, {
    cwd: location,
    stdio: "inherit",
  });
}
