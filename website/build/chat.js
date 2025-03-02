import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const main = async () => {
  const dest = `${__dirname}/../public/chat`;
  if (fs.existsSync(dest) === true)
    await fs.promises.rm(dest, { recursive: true });
  await fs.promises.cp(
    `${__dirname}/../node_modules/@agentica/chat/dist`,
    dest,
    {
      recursive: true,
    },
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
