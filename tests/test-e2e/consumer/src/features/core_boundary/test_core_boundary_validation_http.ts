import assert from "node:assert/strict";

import api from "../../api";

/**
 * Verifies compiled validator effects and the manual core body protocol.
 *
 * Source routing cannot prove that installed helper dependencies execute or
 * that each descriptor's failure reaches the actual HTTP adapter. Clone return
 * identity is observed directly because TypedBody returns its raw parsed body.
 *
 * 1. For ten helpers, submit valid, malformed, extra-field and recovery inputs.
 * 2. Compare literal acceptance, returned values, identity and mutation effects.
 * 3. Exercise each manual assert/is/validate ABI with malformed and recovery
 *    requests.
 *
 * @evidence contracts/testing.md#behavioral-verification Ten actual compiled public helpers expose acceptance, values, identity and extra-property effects; assertClone preserves the input and returns a separate stripped object, while prune changes the original. Three real manual TypedBody descriptors translate malformed input into 400 and recover with exact echoes, including raw clone-body and mutated prune-body effects. Named helper/manual failures are collected so unrelated rows still run.
 * @evidence contracts/testing.md#independent-expectations Literal mode rows preserve original assertValidate distinctions: ordinary modes accept extras, equality modes reject extras, clone retains input extras but strips output, and prune strips both. Authored title/count values and Nest Post's 201 determine outputs; expected flags are not read from emitted functions.
 * @evidence contracts/testing.md#distinguishing-cases Each helper receives valid, wrong-count, extra-field and valid-again input. The manual routes cover all three discriminator branches with a one-property malformed request, extra input and recovery, separating clone return semantics from TypedBody's raw-body contract.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this named async export and passes its current backend connection. Private request and aggregation callbacks execute within this entry, consume responses and preserve each mode's failure identity.
 * @evidence contracts/e2e.md#necessary-boundary The shared compiler's public typia factories must execute with installed runtime dependencies, and manual core descriptor callbacks must reach real Nest validation and transport. Portable global option selection and emitted factory ABI remain Go owning-operation units.
 * @evidence contracts/e2e.md#shared-execution All ten compatible helpers and three ABI routes compile in the same rich producer and reuse its installation, consumer and current backend. No option-specific compiler program, backend or independent feature build is introduced.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each request creates fresh parsed input, and only that input may be pruned. Every response is consumed, module descriptors retain immutable helper closures and no request state or mutable observer survives the operation.
 * @evidence contracts/e2e.md#preserved-coverage Original valid/malformed and ordinary/equality/clone/prune return and mutation oracles execute here; the ten global option configurations are split into direct Go routing/emitted-factory units plus these compatible runtime helpers. This does not claim ten global-configured installed programs ran, and serializer/publication cohorts remain separately pending.
 */
export const test_core_boundary_validation_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const failures: unknown[] = [];
  const request = async (path: string, body: unknown) => {
    const response = await fetch(
      `${connection.host}/core_boundary/validation/${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const text = await response.text();
    return {
      status: response.status,
      body: text.length ? JSON.parse(text) : null,
    };
  };
  for (const [mode, equality, clone, prune] of [
    ["assert", false, false, false],
    ["is", false, false, false],
    ["validate", false, false, false],
    ["assertEquals", true, false, false],
    ["equals", true, false, false],
    ["validateEquals", true, false, false],
    ["assertClone", false, true, false],
    ["validateClone", false, true, false],
    ["assertPrune", false, false, true],
    ["validatePrune", false, false, true],
  ] as const) {
    try {
      for (const [kind, input] of [
        ["valid", { title: "title", count: 1 }],
        ["malformed", { title: "title", count: "wrong" }],
        ["extra", { title: "title", count: 1, extra: "x" }],
        ["recovery", { title: "title", count: 1 }],
      ] as const) {
        const result = await request(`inspect/${mode}`, input);
        const accepted =
          kind !== "malformed" && !(kind === "extra" && equality);
        assert.equal(result.status, 201, `${mode}/${kind}`);
        assert.deepEqual(
          result.body,
          {
            accepted,
            inputExtra: kind === "extra" && !prune,
            outputExtra: accepted ? kind === "extra" && !clone && !prune : null,
            sameReference: accepted ? !clone : null,
            title: accepted ? "title" : null,
            count: accepted ? 1 : null,
          },
          `${mode}/${kind}`,
        );
      }
    } catch (cause) {
      failures.push(new Error(`Compiled helper ${mode} failed`, { cause }));
    }
  }
  for (const [mode, extraStatus, extraPresent] of [
    ["assertClone", 201, true],
    ["equals", 400, false],
    ["validatePrune", 201, false],
  ] as const) {
    try {
      for (const [kind, input, status] of [
        ["valid", { title: "title", count: 1 }, 201],
        ["malformed", { title: "title", count: "wrong" }, 400],
        ["extra", { title: "title", count: 1, extra: "x" }, extraStatus],
        ["recovery", { title: "title", count: 1 }, 201],
      ] as const) {
        const result = await request(`manual/${mode}`, input);
        assert.equal(result.status, status, `${mode}/${kind}`);
        if (status === 201)
          assert.deepEqual(
            result.body,
            {
              title: "title",
              count: 1,
              extraPresent: kind === "extra" && extraPresent,
            },
            `${mode}/${kind}`,
          );
      }
    } catch (cause) {
      failures.push(new Error(`Manual body ${mode} failed`, { cause }));
    }
  }
  if (failures.length)
    throw new AggregateError(failures, "Core validator boundaries failed");
};
