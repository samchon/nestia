const cp = require("child_process");
const fs = require("fs");
const JsZip = require("jszip");

const PACKAGE = `${__dirname}/../../packages/editor`;
const ASSETS = `${PACKAGE}/dist/assets`;

const main = async () => {
  cp.execSync("npm install && npm run build:static", {
    stdio: "ignore",
    cwd: PACKAGE,
  });
  const zip = new JsZip();
  zip.file(
    "index.html",
    await fs.promises.readFile(`${PACKAGE}/dist/index.html`),
  );
  for (const file of await fs.promises.readdir(ASSETS))
    zip.file(`assets/${file}`, await fs.promises.readFile(`${ASSETS}/${file}`));
  const buffer = await zip.generateAsync({
    type: "uint8array",
    compressionOptions: {
      level: 0,
    },
  });
  try {
    await fs.promises.mkdir(`${__dirname}/../public/downloads`);
  } catch {}
  await fs.promises.writeFile(
    `${__dirname}/../public/downloads/editor.zip`,
    buffer,
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
