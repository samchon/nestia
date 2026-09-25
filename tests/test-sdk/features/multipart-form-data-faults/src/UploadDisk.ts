import fs from "fs";
import os from "os";
import path from "path";

/** The directory each adapter's disk storage writes to. */
export const UPLOAD_DISK = {
  express: fs.mkdtempSync(path.join(os.tmpdir(), "nestia-upload-express-")),
  fastify: fs.mkdtempSync(path.join(os.tmpdir(), "nestia-upload-fastify-")),
};
