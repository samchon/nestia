import { TestValidator } from "@nestia/e2e";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import fs from "fs";

import api from "@api";

import { Backend } from "../../Backend";
import { UPLOAD_DISK } from "../../UploadDisk";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Both adapters must return exact413/400 statuses and selected multer/busboy/filter messages for six faults, accept/read disk bytes then leave no files on success or invalid fields, and retain a valid SDK memory upload returning3.
 * @evidence contracts/testing.md#independent-expectations Authored limits/single-field/filter/typed count declarations distinguish client faults; explicit request contents establish disk text and byte length. Handwritten Nest/multer error messages and adapter-specific truncated-form messages are the error contract, not copied snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Oversize, repeated/unexpected field, missing boundary, truncated body and custom HttpException contrast error mapping; disk success/validation rejection contrast cleanup branches with a memory success twin on Express/Fastify.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual parsers, storage files, native field validation and HTTP exception mapping must connect. In-process error classification alone cannot prove status/message or disk cleanup after a request.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each adapter uses its authored unique UPLOAD_DISK directory; requests run serially and inspect it immediately. The additional Fastify application owns listen/calls within try/finally. Upload directory lifetime beyond the feature process remains a fixture-module limitation; this case certifies file cleanup, not empty directory removal.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
 */
export const test_multipart_form_data_faults = async (
  connection: api.IConnection,
): Promise<void> => {
  const fastify: NestFastifyApplication = await Backend.fastify();
  try {
    await fastify.listen(0, "127.0.0.1");
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
