import assert from "node:assert/strict";
import typia from "typia";

import api from "../../api";

/**
 * Verifies private Date and all eight private multipart fields without changing
 * the original void handler.
 *
 * Private declaration extraction and native representations must connect to an
 * installed generated client; literal wire/status controls distinguish metadata
 * loss.
 *
 * 1. Exercise the original generated successful operation with independent values.
 * 2. Send adjacent malformed raw values, then verify a valid generated recovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Generated successful requests return the original void or ISO wire result, malformed raw requests return 400 and valid requests recover.
 * @evidence contracts/testing.md#independent-expectations ISO round trip, UUID spelling and int32 integer limits establish independent expectations. Multipart success must remain undefined; generated-type validation is an additional connection and does not replace raw malformed controls.
 * @evidence contracts/testing.md#distinguishing-cases Dynamic date-time string and Date JSON wire fields contrast native values; all eight form fields accompany int32 min/max, malformed UUID, fraction and overflow controls, followed by valid recovery.
 * @evidence contracts/testing.md#execution-ownership This matching export runs in the shared consumer after public installed producer/generation/consumer compilation, once per actual adapter.
 * @evidence contracts/e2e.md#necessary-boundary Native private Date and multipart declarations must survive cloning and connect to JSON serialization, generated form encoding and actual multipart decoding.
 * @evidence contracts/e2e.md#shared-execution The case uses the existing installed artifacts, two rich programs and adapter lifetimes; no preparation is created here.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Stateless original handlers and the clone_complex prefix isolate inputs; raw bodies are consumed and host teardown remains with the common entry.
 * @evidence contracts/e2e.md#preserved-coverage Original private Date GET and multipart POST remain in the complete fresh generated HTTP population. Handwritten controls strengthen authored-case-zero inputs and do not claim a changed byte-echo handler.
 */
export const test_clone_complex_private_native = async (
  connection: api.IConnection,
): Promise<void> => {
  const date = await api.functional.clone_complex.date.get(connection);
  for (const value of [date.string, date.date]) {
    assert.equal(typeof value, "string");
    assert.ok(Number.isFinite(Date.parse(value)));
    assert.equal(new Date(value).toISOString(), value);
  }
  const route = api.functional.clone_complex.multipart.post;
  const body = typia.assert<Parameters<typeof route>[1]>({
    id: "d3f4c1c2-6b7e-4f3a-9a3e-2b1c0d9e8f7a",
    strings: ["one", "two"],
    number: 3.5,
    integers: [-2147483648, 2147483647],
    blob: new Blob(["blob"]),
    blobs: [new Blob(["blobs"])],
    file: new File(["file"], "file.txt"),
    files: [new File(["files"], "files.txt")],
  });
  assert.equal(await route(connection, body), undefined);
  for (const [id, integers] of [
    ["not-a-uuid", [-2147483648, 2147483647]],
    [body.id, [0.5]],
    [body.id, [2147483648]],
  ] as const) {
    const form = new FormData();
    form.append("id", id);
    for (const value of body.strings) form.append("strings", value);
    form.append("number", String(body.number));
    for (const value of integers) form.append("integers", String(value));
    form.append("blob", body.blob);
    for (const value of body.blobs) form.append("blobs", value);
    form.append("file", body.file);
    for (const value of body.files) form.append("files", value);
    const response = await fetch(`${connection.host}/clone_complex/multipart`, {
      method: "POST",
      body: form,
    });
    const status = response.status;
    await response.arrayBuffer();
    assert.equal(status, 400);
    assert.equal(await route(connection, body), undefined);
  }
};
