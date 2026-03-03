import fs from "fs";

if (fs.existsSync(`${__dirname}/../.env`) === false)
  fs.copyFileSync(`${__dirname}/../.env.local`, `${__dirname}/../.env`);
