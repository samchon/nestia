import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import assert from "node:assert/strict";
import { createCipheriv } from "node:crypto";
import { WebSocketConnector, WebSocketError } from "tgrid";

import api from "../../api";
import type { createMcpConnection } from "../../internal/McpConnection";

/**
 * Verifies compiled validator effects and the manual core body protocol.
 *
 * Source routing cannot prove that installed helper dependencies execute or
 * that each descriptor's failure reaches the actual HTTP adapter. Clone return
 * identity is observed beside the raw request body so a discarded clone cannot
 * masquerade as successful argument binding.
 *
 * 1. For ten helpers, submit valid, malformed, extra-field and recovery inputs.
 * 2. Compare literal acceptance, returned values, identity and mutation effects.
 * 3. Exercise manual assert/is/validate binding with malformed and recovery
 *    requests.
 * 4. Compare encrypted, WebSocket and MCP cloned arguments through their actual
 *    transports, retaining each protocol's rejection and recovery behavior.
 *
 * @evidence contracts/testing.md#behavioral-verification Ten compiled helpers expose acceptance, values, identity and mutation. Manual TypedBody routes compare cloned argument and raw body identity beside is/prune controls. Actual ciphertext, WebSocket header RPC and shared official MCP calls distinguish successful callback data forwarding from raw-input binding; each transport retains malformed and recovery cases and failures are aggregated across independent groups.
 * @evidence contracts/testing.md#independent-expectations Literal mode rows preserve original assertValidate distinctions: ordinary modes accept extras, equality modes reject extras, clone retains input extras but strips output, and prune strips both. Authored title/count values and Nest Post's 201 determine outputs; expected flags are not read from emitted functions.
 * @evidence contracts/testing.md#distinguishing-cases Every helper and transport receives valid, wrong-count, extra-field and recovery inputs. HTTP and WebSocket identity reports distinguish separate clones from mutation; encrypted and MCP projections reject extra retention. WebSocket malformed input must reject with close1003 and MCP with actual McpError InvalidParams, rather than arbitrary network failure.
 * @evidence contracts/testing.md#execution-ownership The common consumer discovers this named async export and passes its current backend connection. Private request and aggregation callbacks execute within this entry, consume responses and preserve each mode's failure identity.
 * @evidence contracts/e2e.md#necessary-boundary The shared compiler's public typia factories must execute with installed runtime dependencies, and manual core descriptor callbacks must reach real Nest validation and transport. Portable global option selection and emitted factory ABI remain Go owning-operation units.
 * @evidence contracts/e2e.md#shared-execution Ten compatible helpers and all binding routes use the same rich producer, installation, generated consumer and current Express or Fastify backend. The existing encrypted module password and one official MCP client are reused; WebSocket specimens require their own handshake because the immutable header differs, with no additional compiler program or backend.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Each request has fresh input and ciphertext; only request-local input may be pruned. Responses are consumed, each accepted WebSocket connector closes in finally, and the common consumer owns MCP acquisition and shutdown after all cases settle. Immutable validator closures retain no request observer state.
 * @evidence contracts/e2e.md#preserved-coverage Original valid/malformed and ordinary/equality/clone/prune return and mutation oracles execute here; the ten global option configurations are split into direct Go routing/emitted-factory units plus these compatible runtime helpers. This does not claim ten global-configured installed programs ran, and serializer/publication cohorts remain separately pending.
 */
export const test_core_boundary_validation_http = async (
  connection: api.IConnection & {
    mcp: ReturnType<typeof createMcpConnection>["acquire"];
  },
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
    ["assertClone", 201, false],
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
              rawExtraPresent: kind === "extra" && mode === "assertClone",
              sameRawBody: mode !== "assertClone",
            },
            `${mode}/${kind}`,
          );
      }
    } catch (cause) {
      failures.push(new Error(`Manual body ${mode} failed`, { cause }));
    }
  }
  try {
    for (const [kind, input, status] of [
      ["valid", { title: "title", count: 1 }, 201],
      ["malformed", { title: "title", count: "wrong" }, 400],
      ["extra", { title: "title", count: 1, extra: "x" }, 201],
      ["recovery", { title: "title", count: 1 }, 201],
    ] as const) {
      const cipher = createCipheriv(
        "aes-256-cbc",
        Buffer.from("A".repeat(32)),
        Buffer.from("B".repeat(16)),
      );
      const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(input), "utf8"),
        cipher.final(),
      ]).toString("base64");
      const response = await fetch(
        `${connection.host}/core_boundary/validation/manual/encryptedClone`,
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: ciphertext,
        },
      );
      const body = await response.json();
      assert.equal(response.status, status, `encrypted/${kind}`);
      if (status === 201)
        assert.deepEqual(
          body,
          { title: "title", count: 1, extraPresent: false },
          `encrypted/${kind}`,
        );
    }
  } catch (cause) {
    failures.push(new Error("Encrypted cloned argument failed", { cause }));
  }
  try {
    for (const [kind, header] of [
      ["valid", { title: "title", count: 1 }],
      ["malformed", { title: "title", count: "wrong" }],
      ["extra", { title: "title", count: 1, extra: "x" }],
      ["recovery", { title: "title", count: 1 }],
    ] as const) {
      const connector = new WebSocketConnector<
        typeof header,
        null,
        {
          inspect(): {
            title: string;
            count: number;
            extraPresent: boolean;
            rawExtraPresent: boolean;
            sameRawBody: boolean;
          };
        }
      >(header, null);
      try {
        const connect = () =>
          connector.connect(
            `${connection.host.replace(/^http/, "ws")}/core_boundary/validation/manual/wsClone`,
            { timeout: 5000 },
          );
        if (kind === "malformed")
          await assert.rejects(
            connect,
            (error: unknown) =>
              error instanceof WebSocketError && error.status === 1003,
          );
        else {
          await connect();
          assert.deepEqual(
            await connector.getDriver().inspect(),
            {
              title: "title",
              count: 1,
              extraPresent: false,
              rawExtraPresent: kind === "extra",
              sameRawBody: false,
            },
            `websocket/${kind}`,
          );
        }
      } finally {
        if (connector.state === WebSocketConnector.State.OPEN)
          await connector.close();
      }
    }
  } catch (cause) {
    failures.push(new Error("WebSocket cloned argument failed", { cause }));
  }
  try {
    const client = await connection.mcp();
    for (const [kind, args] of [
      ["valid", { title: "title", count: 1 }],
      ["malformed", { title: "title", count: "wrong" }],
      ["extra", { title: "title", count: 1, extra: "x" }],
      ["recovery", { title: "title", count: 1 }],
    ] as const) {
      const call = () =>
        client.callTool({ name: "core_boundary_clone", arguments: args });
      if (kind === "malformed")
        await assert.rejects(
          call,
          (error: unknown) =>
            error instanceof McpError && error.code === ErrorCode.InvalidParams,
        );
      else {
        const result = await call();
        assert.deepEqual(
          JSON.parse((result.content as Array<{ text: string }>)[0]!.text),
          { title: "title", count: 1, extraPresent: false },
          `mcp/${kind}`,
        );
      }
    }
  } catch (cause) {
    failures.push(new Error("MCP cloned argument failed", { cause }));
  }
  if (failures.length)
    throw new AggregateError(failures, "Core validator boundaries failed");
};
