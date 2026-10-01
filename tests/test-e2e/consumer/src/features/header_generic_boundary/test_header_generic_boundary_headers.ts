import assert from "node:assert/strict";
import typia from "typia";

import api from "../../api";
import type { IHeaders } from "../../oracle/header_generic_boundary/structures/headers/IHeaders";

/**
 * Verifies the original decomposed header DTO still round-trips its values.
 *
 * Swagger's ignored property is still part of runtime header parsing; the
 * original numeric-array rejection must remain connected to this copied route.
 *
 * 1. Submit all original headers, including the ignored descriptions array.
 * 2. Compare the echo with the independent authored DTO and literal input.
 * 3. Reject nonnumeric array elements and repeat the valid request unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated decomposed header client must echo the full submitted DTO, including ignored descriptions; malformed numeric-array headers reject and the following valid request succeeds without mutating caller input.
 * @evidence contracts/testing.md#independent-expectations Original IHeaders and its echo handler establish exact submitted values independently of generated clones. Literal numeric/boolean/string arrays contrast HTTP400 for nonnumeric x-values.
 * @evidence contracts/testing.md#distinguishing-cases All five visible fields plus the ignored runtime field exercise string, defaulted optional and numeric/boolean arrays. Malformed values contrast valid requests before and after failure; document-name assertions belong to the sibling Swagger case.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this sole matching export and awaits its generated client and raw malformed-wire request after the existing compilation.
 * @evidence contracts/e2e.md#necessary-boundary Actual generated header encoding, TypedHeaders decoding and native validation must interoperate across HTTP with decompose:true. A schema or string-join unit cannot establish that echo.
 * @evidence contracts/e2e.md#shared-execution The original controller participates in the existing rich producer, All generation, consumer compilation and Express/Fastify applications; this case adds none.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The dedicated route prefix isolates the original DTO. The local input is compared after both requests and every response is consumed before shared cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Original headers-decompose/test_api_headers's full valid echo and invalid numeric-array rejection survive here. Exact400, recovery and caller equality strengthen its any-rejection boundary; execution is pending.
 */
export const test_header_generic_boundary_headers = async (
  connection: api.IConnection,
): Promise<void> => {
  const route =
    api.functional.header_generic_boundary.decompose.headers.emplace;
  const headers: Required<IHeaders> = {
    "x-category": "x",
    "x-memo": "authored memo",
    "x-name": "Samchon",
    "x-values": [1, 2, 3],
    "x-flags": [true, false, true],
    "X-descriptions": ["a", "b", "c"],
  };
  const original = structuredClone(headers);
  const send = async (): Promise<void> => {
    const output = await route({ ...connection, headers }, "section");
    typia.assertEquals<IHeaders>(output);
    assert.deepEqual(output, original);
  };
  await send();
  const response = await fetch(
    `${connection.host}/header_generic_boundary/decompose/headers/section`,
    {
      method: "PATCH",
      headers: {
        "x-category": "x",
        "x-memo": "authored memo",
        "x-name": "Samchon",
        "x-values": "one,two,three",
        "x-flags": "true,false,true",
        "X-descriptions": "a,b,c",
      },
    },
  );
  await response.text();
  assert.equal(response.status, 400);
  await send();
  assert.deepEqual(headers, original);
};
