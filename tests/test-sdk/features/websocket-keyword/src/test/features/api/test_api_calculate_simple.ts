import { TestValidator } from "@nestia/e2e";

import api from "@api";
import { ICalcEvent } from "@api/lib/interfaces/ICalcEvent";
import { ICalcEventListener } from "@api/lib/interfaces/ICalcEventListener";

/**
 * Verifies api calculate simple.
 *
 * @evidence contracts/testing.md#behavioral-verification All four RPC operators must return literal15/5/50/2 for10/5, and the listener must receive the exact four ordered type/input/output records.
 * @evidence contracts/testing.md#independent-expectations Ordinary arithmetic and handwritten event records determine expectations independently of the generated SDK or server callback values.
 * @evidence contracts/testing.md#distinguishing-cases Deterministic plus/minus/multiplies/divides preserve every operator and operand-order branch under keyword provider props binding; invalid handshakes are owned by websocket-rejection.
 * @evidence contracts/testing.md#execution-ownership DynamicExecutor discovers and awaits the matching calculator export after native SDK generation and consumer compilation. A missing event deadline or mismatched result rejects its report.
 * @evidence contracts/e2e.md#necessary-boundary The real generated connector, header precision, bidirectional provider RPC and listener callback must connect; in-process arithmetic cannot certify transport or listener argument binding.
 * @evidence contracts/e2e.md#shared-execution All four operator/notification controls reuse one connector and the feature backend. Packed dependencies and compatible producer/emitted runtime are shared, with no compiler per operation.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Events/completion/timer belong to this call; finally cancels the five-second notification deadline and closes the connector on either success or assertion failure. The entry closes its backend.
 * @evidence contracts/e2e.md#preserved-coverage Four deterministic required operations replace100 random choices without dropping an operator or event comparison; actual notification completion replaces an unconditional100ms delay.
 */
export const test_api_calculate_simple = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: ICalcEvent[] = [];
  let complete!: () => void;
  const received = new Promise<void>((resolve) => {
    complete = resolve;
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listener: ICalcEventListener = {
    on: (e) => {
      events.push(e);
      if (events.length === 4) complete();
    },
  };
  const { connector, driver } = await api.functional.calculate.simple(
    {
      ...connection,
      headers: {
        precision: 2,
      },
    },
    {
      provider: listener,
    },
  );
  const expected = [
    { type: "plus" as const, input: [10, 5], output: 15 },
    { type: "minus" as const, input: [10, 5], output: 5 },
    { type: "multiplies" as const, input: [10, 5], output: 50 },
    { type: "divides" as const, input: [10, 5], output: 2 },
  ] satisfies ICalcEvent[];
  try {
    for (const e of expected) {
      const z: number = await driver[e.type](e.input[0]!, e.input[1]!);
      TestValidator.equals("result", z, e.output);
    }
    await Promise.race([
      received,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error("Missing calculator events.")),
          5_000,
        );
      }),
    ]);
    TestValidator.equals("events", events, expected);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    await connector.close();
  }
};
