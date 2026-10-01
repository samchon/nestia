import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies emitted aliased decorators decode and reject actual HTTP inputs.
 *
 * A correct alias classification must reach executable validators and the
 * response serializer through the installed Nest adapter.
 *
 * 1. Reject independently malformed path, query and body inputs.
 * 2. Submit valid input afterward and require the exact serialized response.
 *
 * @evidence contracts/testing.md#behavioral-verification The response echoes path/query/body values through the generated route. Invalid UUID, absent required query and wrong body property each fail with 400; a following valid request succeeds with exact JSON output.
 * @evidence contracts/testing.md#independent-expectations The fixture's authored UUID tag, required keyword and numeric count reject the three submitted negative values. Literal submitted values and Nest Post's 201 establish the positive output independently.
 * @evidence contracts/testing.md#distinguishing-cases Each negative changes one input axis and shares the other valid values. The final positive distinguishes validator rejection from persistent backend failure.
 * @evidence contracts/testing.md#execution-ownership The sole consumer discovers this named async export and passes its current shared backend connection.
 * @evidence contracts/e2e.md#necessary-boundary Resolved aliases must connect emitted native validator helpers to installed decorator runtime and the actual Nest transport; source text alone cannot establish execution.
 * @evidence contracts/e2e.md#shared-execution All four requests reuse the common producer, consumer, installation and backend without another compile or process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The stateless route receives fresh bodies and consumes every response; no global callback or decoder state is replaced.
 * @evidence contracts/e2e.md#preserved-coverage This owns actual generated alias runtime effects, with independent malformed/recovery controls. Original validate-mode discriminator and TypedParam flag probes still require their config-specific owner and are not claimed as transferred here.
 */
export const test_core_boundary_alias_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const id = "00000000-0000-4000-8000-000000000000";
  for (const [path, query, body, status] of [
    ["not-a-uuid", "?keyword=hello", { title: "title", count: 1 }, 400],
    [id, "", { title: "title", count: 1 }, 400],
    [id, "?keyword=hello", { title: "title", count: "wrong" }, 400],
    [id, "?keyword=hello", { title: "title", count: 1 }, 201],
  ] as const) {
    const response = await fetch(
      `${connection.host}/core_boundary/alias/${path}${query}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    assert.equal(response.status, status, `${path}${query}`);
    if (status === 201)
      assert.deepEqual(await response.json(), {
        id,
        keyword: "hello",
        title: "title",
        count: 1,
      });
    else await response.text();
  }
};
