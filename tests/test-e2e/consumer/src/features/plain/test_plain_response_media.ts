import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies raw plain-text replies preserve markup as data with plain media.
 *
 * Swagger's ApiProduces describes documentation and cannot set runtime headers.
 * This case observes the adapter response before any generated client
 * decoding.
 *
 * 1. Submit literal markup to unrestricted and valid template body routes.
 * 2. Check unchanged bytes, status and text/plain media; contrast constant
 *    rejection.
 *
 * @evidence contracts/testing.md#behavioral-verification Raw HTTP responses must echo the exact accepted markup bodies with text/plain media, while the finite constant route accepts A and rejects markup with 400.
 * @evidence contracts/testing.md#independent-expectations Authored Header/ApiProduces declarations identify plain media, literal input strings identify unchanged body bytes, Nest Post defaults to 201 and the A/B/C body union excludes markup.
 * @evidence contracts/testing.md#distinguishing-cases Unrestricted text and a template-valid markup value contrast a finite literal body. Runtime Content-Type is checked independently of Swagger and decoded SDK values.
 * @evidence contracts/testing.md#execution-ownership The sole consumer DynamicExecutor discovers and awaits this case against its current shared adapter session.
 * @evidence contracts/e2e.md#necessary-boundary The actual Nest adapter's reply media and body handling must connect to declared plain responses; metadata or writer units cannot prove how literal markup is served.
 * @evidence contracts/e2e.md#shared-execution Existing installation, compiled programs and running backend supply all four requests; no browser, compiler or independent server is created.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Stateless echo routes use fresh literal bodies and no persistent state; every response body is consumed before the shared host closes.
 * @evidence contracts/e2e.md#preserved-coverage Original string/template/constant echo assertions remain in their named cases. This adds the previously unobserved runtime media distinction and a malformed constant twin.
 */
export const test_plain_response_media = async (
  connection: api.IConnection,
): Promise<void> => {
  const markup = "<script>alert('plain-data')</script>";
  for (const [route, body] of [
    ["string", markup],
    ["template", `something_123_interesting_${markup}_is_not_true_it?`],
    ["constant", "A"],
  ] as const) {
    const response = await fetch(`${connection.host}/plain/plain/${route}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    assert.equal(response.status, 201, route);
    assert.equal(await response.text(), body, route);
    assert.match(
      response.headers.get("Content-Type") ?? "",
      /^text\/plain(?:;|$)/i,
      route,
    );
  }
  const rejected = await fetch(`${connection.host}/plain/plain/constant`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: markup,
  });
  assert.equal(rejected.status, 400);
  await rejected.text();
};
