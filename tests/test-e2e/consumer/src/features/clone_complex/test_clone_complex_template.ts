import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies all ten original template fields including an empty interpolated
 * string.
 *
 * Native private declarations and generated request types must survive cloning;
 * a literal echo and adjacent malformed request expose losses hidden by random
 * success alone.
 *
 * 1. Submit the independently authored finite specimen through the generated SDK.
 * 2. Require malformed raw input to fail and the original specimen to recover.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated store call echoes each literal field, raw malformed input returns 400 and a subsequent valid generated request returns the same specimen.
 * @evidence contracts/testing.md#independent-expectations The original controller echoes its body; handwritten literal values and raw HTTP status establish the oracle independently of generated random inputs or schemas.
 * @evidence contracts/testing.md#distinguishing-cases The named shape owns its valid nested values, adjacent malformed field and valid recovery; other shapes have their own discovered case.
 * @evidence contracts/testing.md#execution-ownership The sole consumer discovers this matching export after installed native producer, SDK generation and consumer compilation.
 * @evidence contracts/e2e.md#necessary-boundary Private native metadata, cloned declarations, emitted request validation and actual HTTP serialization must connect; a pure writer cannot prove the connection.
 * @evidence contracts/e2e.md#shared-execution This case uses the existing producer, generated consumer, installation and each adapter backend with no extra compiler, generator or process.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Stateless echo handlers and a unique clone_complex prefix isolate specimens; response bodies are consumed and the common entry closes the backend.
 * @evidence contracts/e2e.md#preserved-coverage The original index/at/store fresh generated population remains part of the complete generated consumer census. These literal negative and recovery assertions strengthen the original authored-case-zero input; keyword ABI remains a separate pending boundary.
 */
export const test_clone_complex_template = async (
  connection: api.IConnection,
): Promise<void> => {
  const route = api.functional.clone_complex.template;
  for (const number of [1, 2, 3] as const) {
    const body: Parameters<typeof route.store>[1] = {
      prefix: "prefix_value",
      postfix: "value_postfix",
      middle_string: "the_text_value",
      middle_string_empty: "the__value",
      middle_numeric: "the_12.5_value",
      middle_boolean: number === 2 ? "the_false_value" : "the_true_value",
      ipv4: "1.2.3.4",
      email: "name@example.com",
      combined: `the_${number}_value_with_label_A_text_5_4`,
      nosubstitution: "something",
    };
    assert.deepEqual(await route.store(connection, body), body);
    const response = await fetch(`${connection.host}/clone_complex/template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        combined: `the_${number}_value_with_label_B_text_5_4`,
      }),
    });
    const status = response.status;
    await response.arrayBuffer();
    assert.equal(status, 400);
    assert.deepEqual(await route.store(connection, body), body);
  }
};
