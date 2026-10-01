import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies migration resource paths accept UUID identities and reject plain
 * strings.
 *
 * The authored responses echo resource identities into UUID fields. Their path
 * contract must therefore constrain the same value before response
 * serialization.
 *
 * 1. Read and update both resource kinds using a literal UUID.
 * 2. Check echoed identities and reject the adjacent non-UUID on every ID route.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual emitted TypedParam validators and TypedRoute serializers process HTTP requests; UUID reads and article updates echo the supplied identity, while every malformed resource path returns 400.
 * @evidence contracts/testing.md#independent-expectations The literal UUID conforms to the authored DTO Format<uuid> contract; a plain string does not. Expected IDs come from request specimens rather than generated responses.
 * @evidence contracts/testing.md#distinguishing-cases Article read/update/delete and order read/status share the same resource identity constraint. Valid bodies isolate path validation from body rejection; adjacent malformed IDs exercise all five routes.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers this named case in the sole generated consumer after its shared compile and awaits all requests.
 * @evidence contracts/e2e.md#necessary-boundary The installed native producer must connect path metadata to actual runtime validation and response serialization; a schema writer unit cannot prove the HTTP acceptance boundary.
 * @evidence contracts/e2e.md#shared-execution The existing packed installation, producer, consumer and running application serve all requests; this case creates no compiler or host.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity These authored controllers are stateless. Each request uses a fresh payload, and the literal identity requires no persistent record or preceding mutation.
 * @evidence contracts/e2e.md#preserved-coverage Original rich migration schemas retain UUID response fields; the new live connection strengthens their previously compile-only fixture and leaves legacy archives intact pending final transfer.
 */
export const test_migration_resource_identity = async (
  connection: api.IConnection,
): Promise<void> => {
  const id = "00000000-0000-4000-8000-000000000001";
  for (const [resource, method, suffix, body] of [
    ["articles", "GET", "", undefined],
    ["articles", "PUT", "", { title: "updated" }],
    ["articles", "DELETE", "", undefined],
    ["orders", "GET", "", undefined],
    ["orders", "PATCH", "/status", { status: "paid" }],
  ] as const) {
    const request = (identity: string) =>
      fetch(`${connection.host}/${resource}/${identity}${suffix}`, {
        method,
        ...(body === undefined
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }),
      });
    const valid = await request(id);
    assert.equal(valid.status, 200, `${method} ${resource}: UUID accepted`);
    if (method === "GET" || method === "PUT") {
      const output = await valid.json();
      assert.equal(output.id, id);
      if (resource === "articles" && method === "GET")
        assert.equal(output.author.id, id);
    } else await valid.text();
    const invalid = await request("not-a-uuid");
    assert.equal(
      invalid.status,
      400,
      `${method} ${resource}: plain ID rejected`,
    );
    await invalid.text();
  }
};
