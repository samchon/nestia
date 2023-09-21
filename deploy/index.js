const { publish } = require("./publish");

const tag = process.argv[2];
const version = process.argv[3];

if (tag !== "latest" && tag !== "next" && tag !== "tgz")
    throw new Error("Invalid tag");
if (!version?.length) throw new Error("Invalid version");

publish(tag)(version);
