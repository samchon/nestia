import { TestValidator } from "@nestia/e2e";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import fs from "fs";

import { Backend } from "../../Backend";
import { UPLOAD_DISK } from "../../UploadDisk";
import api from "../../api";

/**
 * Verifies a multipart request the multer configuration rejects answers the
 * client error NestJS gives it, and disk storage leaves no file behind, on
 * Express and on Fastify.
 *
 * `@TypedFormData.Body()` rethrew multer's `MulterError` as is, so a file over
 * `limits.fileSize`, a second file on a single-file field, and an unexpected
 * field all answered 500; and it read each disk-stored file into a `File`
 * without removing it, so every request leaked its uploads (#1710).
 *
 * 1. On both adapters, send a file over the limit, two files on the single-file
 *    field, an unexpected file field, a body without a boundary, and a
 *    truncated body; assert 413 or 400 with the message NestJS gives.
 * 2. Assert a `fileFilter`'s own `HttpException` is kept.
 * 3. Upload through disk storage, and a disk upload whose fields fail validation;
 *    assert the handler read the file and the directory is empty.
 * 4. Assert a valid memory upload still succeeds through the SDK.
 */
export const test_multipart_form_data_faults = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication = await Backend.fastify();
  await fastify.listen(0, "127.0.0.1");
  try {
    for (const [adapter, host] of [
      ["express", connection.host],
      ["fastify", (await fastify.getUrl()).replace("[::1]", "127.0.0.1")],
    ] as const)
      await validate(adapter, host);
  } finally {
    await fastify.close();
  }
};

type IBody = FormData | { type: string; text: string };

const validate = async (
  adapter: "express" | "fastify",
  host: string,
): Promise<void> => {
  const post = async (path: string, body: IBody): Promise<[number, string]> => {
    const response: Response = await fetch(`${host}/${adapter}/${path}`, {
      method: "POST",
      ...(body instanceof FormData
        ? { body }
        : { body: body.text, headers: { "content-type": body.type } }),
    });
    return [response.status, await response.text()];
  };
  const form = (entries: Array<[string, string | File]>): FormData => {
    const output: FormData = new FormData();
    for (const [key, value] of entries) output.append(key, value);
    return output;
  };
  const expect = async (
    title: string,
    path: string,
    body: IBody,
    status: number,
    message: string,
  ): Promise<void> => {
    const [actual, text] = await post(path, body);
    TestValidator.equals(`${adapter} ${title} status ${text}`, actual, status);
    TestValidator.equals(
      `${adapter} ${title} message`,
      (JSON.parse(text) as { message: string }).message,
      message,
    );
  };

  // client faults, as NestJS's FileInterceptor answers them
  await expect(
    "file over the limit",
    "memory",
    form([
      ["file", new File(["x".repeat(100)], "a.txt")],
      ["count", "1"],
    ]),
    413,
    "File too large",
  );
  await expect(
    "two files on a single-file field",
    "memory",
    form([
      ["file", new File(["a"], "a.txt")],
      ["file", new File(["b"], "b.txt")],
      ["count", "1"],
    ]),
    400,
    "Unexpected field - file",
  );
  await expect(
    "unexpected file field",
    "memory",
    form([
      ["file", new File(["a"], "a.txt")],
      ["other", new File(["b"], "b.txt")],
      ["count", "1"],
    ]),
    400,
    "Unexpected field - other",
  );
  await expect(
    "no boundary",
    "memory",
    { type: "multipart/form-data", text: "" },
    400,
    "Multipart: Boundary not found",
  );
  await expect(
    "truncated body",
    "memory",
    {
      type: "multipart/form-data; boundary=cut",
      text: '--cut\r\nContent-Disposition: form-data; name="count"\r\n\r\n1',
    },
    400,
    // busboy under multer, @fastify/busboy under fastify-multer
    adapter === "express"
      ? "Multipart: Unexpected end of form"
      : "Multipart: Unexpected end of multipart data",
  );
  await expect(
    "fileFilter's own exception",
    "filter",
    form([
      ["file", new File(["a"], "a.txt")],
      ["count", "1"],
    ]),
    400,
    "filtered",
  );

  // disk storage leaves nothing behind, read or rejected
  const disk: string = UPLOAD_DISK[adapter];
  const [status, text] = await post(
    "disk",
    form([
      ["file", new File(["on disk"], "a.txt")],
      ["count", "1"],
    ]),
  );
  TestValidator.equals(`${adapter} disk status`, status, 201);
  TestValidator.equals(`${adapter} disk read`, JSON.parse(text), "on disk");
  TestValidator.equals(`${adapter} disk emptied`, fs.readdirSync(disk), []);
  const [invalid] = await post(
    "disk",
    form([
      ["file", new File(["on disk"], "a.txt")],
      ["count", "not a number"],
    ]),
  );
  TestValidator.equals(`${adapter} disk invalid status`, invalid, 400);
  TestValidator.equals(
    `${adapter} disk invalid emptied`,
    fs.readdirSync(disk),
    [],
  );

  // a valid upload still passes, through the SDK
  const sdk =
    adapter === "express" ? api.functional.express : api.functional.fastify;
  TestValidator.equals(
    `${adapter} sdk memory`,
    await sdk.memory({ host }, { file: new File(["abc"], "a.txt"), count: 1 }),
    3,
  );
};
