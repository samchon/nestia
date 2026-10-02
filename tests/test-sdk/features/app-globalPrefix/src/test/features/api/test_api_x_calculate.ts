import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "@api";
import { IListener } from "@api/lib/structures/IListener";

/**
 * Verifies arithmetic RPC results and callback order at the app-globalPrefix
 * route.
 *
 * Route composition must connect the generated WebSocket client to the same
 * authored calculator after prefix, version or router-module composition.
 *
 * 1. Connect a generated client with a listener recording callback events.
 * 2. Compare each result and the full callback list with independent arithmetic.
 *
 * @evidence contracts/testing.md#behavioral-verification The generated calculate.connect client invokes four arithmetic RPC names and compares each result and the listener event sequence; wrong route wiring, operation dispatch or callback ordering fails.
 * @evidence contracts/testing.md#independent-expectations Native addition, subtraction, division and multiplication of 10 and 5 establish expected values independently of the server implementation.
 * @evidence contracts/testing.md#distinguishing-cases One hundred selected operations exercise RPC results and callbacks; this random workload does not guarantee every operator occurs, and it does not own invalid-input rejection.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case after start.js generates and compiles its consumer; the actual WebSocket connection is E2E.
 * @evidence contracts/e2e.md#necessary-boundary This case connects the generated accessor through app-globalPrefix route composition to RPC dispatch and reverse callbacks; direct arithmetic cannot establish that transport assembly.
 * @evidence contracts/e2e.md#shared-execution All hundred calls share one connector and feature backend. The restored harness still prepares independent feature consumers and hosts, so whole-suite preparation consolidation remains incomplete.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Events are case-local and the connector closes in finally after successful connection. The fixed callback delay is a timing limitation, and a connection failure before try depends on transport-owned cleanup.
 * @evidence contracts/e2e.md#preserved-coverage Per-call arithmetic and the complete ordered callback list remain asserted at this exported owner; no existing distinctions are deleted.
 */
export const test_api_x_calculate = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: IListener.IEvent[] = [];
  const listener: IListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } = await api.functional.x.calculate.connect(
    connection,
    listener,
  );
  const expected: IListener.IEvent[] = new Array(100).fill(0).map(() => {
    const operator = typia.random<IListener.IEvent["operator"]>();
    const x: number = 10;
    const y: number = 5;
    return {
      operator,
      x,
      y,
      z:
        operator === "plus"
          ? x + y
          : operator === "minus"
            ? x - y
            : operator === "divide"
              ? x / y
              : operator === "multiply"
                ? x * y
                : 0,
    };
  });
  try {
    for (const e of expected) {
      const z: number = await driver[e.operator](e.x, e.y);
      TestValidator.equals("result", z, e.z);
    }
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
