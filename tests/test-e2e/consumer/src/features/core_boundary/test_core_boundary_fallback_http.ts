import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies manual core fallbacks through the actual common HTTP adapter.
 *
 * Grouping repeated HTTP fields and reconstructing uploaded File content depend
 * on the installed decorators and adapter, beyond a direct parser call.
 *
 * 1. Preserve the four original fallback status and literal body assertions.
 * 2. Reject unsupported urlencoded/multipart media and recover with valid input.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual HTTP headers remain a record, repeated query and body keys become arrays, and uploaded File name/content survive. Unsupported body media fails and later valid requests succeed.
 * @evidence contracts/testing.md#independent-expectations Literal submitted header, repeated fields, file name and bytes establish exact expected records. Nest Get/Post defaults establish 200/201 and public decorators require their named body media.
 * @evidence contracts/testing.md#distinguishing-cases Four decoder families retain separate response assertions; wrong media precedes valid body requests to distinguish rejection from poisoned shared state.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this named async export and supplies its actual current backend connection.
 * @evidence contracts/e2e.md#necessary-boundary Public manual decorators, installed Nest adapter and actual HTTP field/file transport must agree; direct parser units cannot certify this connection.
 * @evidence contracts/e2e.md#shared-execution These requests reuse the common installed producer, consumer and backend. No compiler, installer, independent server or child process is started.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Fresh requests and form bodies target stateless isolated routes, consume each response and leave shared host closure to its owner. Manual decorator guard restoration occurs during producer class composition.
 * @evidence contracts/e2e.md#preserved-coverage The four original test-core-e2e fallback HTTP literal oracles execute here. Disabled compiler-wrapper configuration remains a separate pending owner; this manual runtime case does not replace it.
 */
export const test_core_boundary_fallback_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const host = `${connection.host}/core_boundary/fallback`;
  const headers = await fetch(`${host}/headers`, {
    headers: { "x-name": "abc" },
  });
  assert.equal(headers.status, 200);
  assert.deepEqual(await headers.json(), { isArray: false, name: "abc" });

  const query = await fetch(`${host}/query?title=hello&tags=a&tags=b`);
  assert.equal(query.status, 200);
  assert.deepEqual(await query.json(), { title: "hello", tags: ["a", "b"] });

  for (const route of ["urlencoded", "multipart"]) {
    const invalid = await fetch(`${host}/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "hello" }),
    });
    assert.equal(invalid.status, 400, route);
    await invalid.text();
  }
  const urlencoded = await fetch(`${host}/urlencoded`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "title=hello&tags=a&tags=b",
  });
  assert.equal(urlencoded.status, 201);
  assert.deepEqual(await urlencoded.json(), {
    title: "hello",
    tags: ["a", "b"],
  });

  const form = new FormData();
  form.append("title", "hello");
  form.append("tags", "a");
  form.append("tags", "b");
  form.append(
    "file",
    new File(["content"], "note.txt", { type: "text/plain" }),
  );
  const multipart = await fetch(`${host}/multipart`, {
    method: "POST",
    body: form,
  });
  assert.equal(multipart.status, 201);
  assert.deepEqual(await multipart.json(), {
    title: "hello",
    tags: ["a", "b"],
    file: { name: "note.txt", text: "content" },
  });
};
