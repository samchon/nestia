const { build } = require("./build");
const { publish } = require("./publish");

const main = async () => {
  if (process.argv[2] === "build") await build();
  else if (process.argv[2] === "publish") {
    const index = process.argv.indexOf("--tag");
    const tag = index === -1 ? "next" : process.argv[index + 1];
    await publish(tag);
  }
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
