const { publish } = require("./publish");

const tag = process.argv[2];
if (tag !== "latest" && tag !== "next" && tag !== "tgz")
  throw new Error("Invalid tag");
publish(tag);
