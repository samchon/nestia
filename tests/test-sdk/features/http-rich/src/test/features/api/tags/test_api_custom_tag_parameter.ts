import assert from "assert/strict";

import api from "../../../../api";

/**
 * Verifies authored custom parameter predicates in the shared actual producer.
 *
 * The original document-only input defines runtime predicates without random
 * generation rules. Authored values test those predicates directly instead of
 * asking a random string generator to invert arbitrary validation code.
 *
 * 1. Send an even-length hexadecimal pubkey and consume its void response.
 * 2. Change only its alphabet, then only its length, and require rejection.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual TypedParam accepts 00aAff12 and rejects GG (alphabet) and abc (length), with all bodies consumed. This pins both authored custom TagBase validators after public compilation.
 * @evidence contracts/testing.md#independent-expectations The original predicates independently require hexadecimal characters and length divisible by two. Literal inputs satisfy or violate exactly one predicate; the void controller contract determines the accepted empty response.
 * @evidence contracts/testing.md#distinguishing-cases A valid mixed-case even-length hex string contrasts with an even-length nonhex string and an odd-length hex string, distinguishing each custom predicate without changing the declarations or supplying random metadata.
 * @evidence contracts/testing.md#execution-ownership The matching authored case executes in the common installed consumer against the real shared application and requires no additional preparation.
 * @evidence contracts/e2e.md#necessary-boundary Native emitted custom predicates must be invoked by the installed TypedParam runtime; direct tag/schema units cannot establish that connection.
 * @evidence contracts/e2e.md#shared-execution The existing installation, producer, generation, consumer compilation and application serve all three requests once.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The endpoint is stateless, each request owns its response and all bodies are consumed. The shared runner releases the application in finally.
 * @evidence contracts/e2e.md#preserved-coverage Original custom declarations are unchanged apart from the class/path identities; this adds explicit runtime controls. The original tags fixture requested no generated E2E execution, and all its original document assertions remain separately discoverable.
 */
export const test_api_custom_tag_parameter = async (
  connection: api.IConnection,
): Promise<void> => {
  const root = connection.host + "/http_rich/tags/transaction/user/";
  const valid = await fetch(root + "00aAff12");
  assert.equal(valid.status, 200);
  assert.equal(await valid.text(), "");
  for (const input of ["GG", "abc"]) {
    const invalid = await fetch(root + input);
    assert.equal(invalid.status, 400);
    await invalid.text();
  }
};
