import { DynamicExecutor } from "@nestia/e2e";
import path from "node:path";

import { createMcpConnection } from "./internal/McpConnection";

/**
 * Verifies the combined generated SDK over the common transport session.
 *
 * Each discovered case retains its own authored oracle and error identity;
 * failures do not stop unrelated request cases from executing.
 *
 * 1. Discover the named request cases in the compiled consumer.
 * 2. Supply the one application's connection and await every case.
 * 3. Reject empty discovery or the aggregate of failed case names.
 *
 * @evidence contracts/testing.md#behavioral-verification DynamicExecutor awaits actual generated client and raw protocol assertions, requires every authored case identity exactly once plus nonempty freshly generated case execution, and rejects aggregate failures; compile success alone cannot pass this entry.
 * @evidence contracts/testing.md#independent-expectations Individual cases keep handwritten values, DTO constraints, arithmetic results and error statuses. The caller registers authored file/export identities before generation; actual execution locations and names must satisfy that input inventory without generated files replacing them.
 * @evidence contracts/testing.md#distinguishing-cases Valid, malformed, nullable, repeated-query, multipart, plain-text, WebSocket and MCP cases retain separate failure names. Per-rule compiler decisions belong to direct native units.
 * @evidence contracts/testing.md#execution-ownership The installed consumer entry calls this exported operation after its single compilation. DynamicExecutor discovers one named test per file recursively and awaits its promise.
 * @evidence contracts/e2e.md#necessary-boundary Generated client imports and transported requests must connect to emitted controllers and installed runtime helpers. Direct writer and transform units cannot detect an incorrect actual wire request.
 * @evidence contracts/e2e.md#shared-execution Both adapter runs reuse one installation, producer compilation, generated consumer compilation and generated artifacts; each run consumes its separately acquired backend with a fresh MCP client, and this operation launches no compiler or server.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Route and DTO namespaces prevent cross-scenario dispatch. Cases own request specimens and WebSocket connectors; this entry owns one lazy official MCP client and closes it after the complete report, including failure. The start entry then closes the backend.
 * @evidence contracts/e2e.md#preserved-coverage The request assertions are mapped individually in the campaign transfer ledger. This entry does not claim coverage of untransferred legacy cases or rule-only assertions.
 */
export const main = async (
  host: string,
  authoredCases: Array<{ file: string; name: string }>,
  adapter: "express" | "fastify",
): Promise<void> => {
  const mcp = createMcpConnection(host, "/mcp");
  try {
    const report = await DynamicExecutor.validate({
      location: __dirname + "/features",
      extension: "js",
      prefix: "test",
      parameters: () => [
        {
          host,
          path: "/mcp",
          mcp: mcp.acquire,
          encryption: { key: "A".repeat(32), iv: "B".repeat(16) },
        },
      ],
      simultaneous: 1,
      onComplete: (execution) => {
        console.log(
          ` - [${adapter}] ${path.relative(__dirname + "/features", execution.location)}#${execution.name}: ${execution.error === null ? "passed" : "failed"}`,
        );
        if (execution.error !== null) console.error(execution.error);
      },
    });
    if (report.executions.length === 0)
      throw new Error("The rich consumer discovered no request cases.");
    const identities = new Map<string, number>();
    let generated = 0;
    for (const execution of report.executions) {
      const file = path
        .relative(__dirname + "/features", execution.location)
        .split(path.sep)
        .join("/");
      const identity = `${file}#${execution.name}`;
      identities.set(identity, (identities.get(identity) ?? 0) + 1);
      if (file.startsWith("generated/")) ++generated;
    }
    for (const authored of authoredCases)
      if (identities.get(`${authored.file}#${authored.name}`) !== 1)
        throw new Error(
          `Authored case was not executed exactly once: ${authored.file}#${authored.name}`,
        );
    if (generated === 0)
      throw new Error("Fresh generated E2E artifacts executed no cases.");
    console.log(
      `Consumer executions [${adapter}]: ${authoredCases.length} authored exactly once, ${generated} fresh generated, ${report.executions.length} total.`,
    );
    const failures = report.executions.filter(
      (execution) => execution.error !== null,
    );
    if (failures.length)
      throw new Error(
        `Rich consumer failed: ${failures.map((execution) => execution.name).join(", ")}`,
      );
  } finally {
    await mcp.close();
  }
};
