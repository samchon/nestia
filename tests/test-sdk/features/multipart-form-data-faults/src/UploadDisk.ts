import fs from "fs";
import path from "path";

const cache: string = path.resolve(
  process.cwd(),
  "node_modules/.cache/multipart-form-data-faults",
);
fs.mkdirSync(cache, { recursive: true });

/** The isolated ignored directory each adapter's disk storage writes to. */
export const UPLOAD_DISK = {
  express: fs.mkdtempSync(path.join(cache, "nestia-upload-express-")),
  fastify: fs.mkdtempSync(path.join(cache, "nestia-upload-fastify-")),
};
