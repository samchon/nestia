import { TestValidator } from "@nestia/e2e";
import { sleep_for } from "tstl";
import typia from "typia";

import api from "@api";
import { ICalcEvent } from "@api/lib/interfaces/ICalcEvent";
import { ICalcEventListener } from "@api/lib/interfaces/ICalcEventListener";

export const test_api_calculate_simple = async (
  connection: api.IConnection,
): Promise<void> => {
  const events: ICalcEvent[] = [];
  const listener: ICalcEventListener = {
    on: (e) => events.push(e),
  };
  const { connector, driver } = await api.functional.calculate.simple(
    {
      ...connection,
      headers: {
        precision: 2,
      },
    },
    listener,
  );
  const expected = new Array(100).fill(0).map(() => {
    const type = typia.random<"plus" | "minus" | "multiplies" | "divides">();
    const x: number = 10;
    const y: number = 5;
    return {
      type,
      input: [x, y],
      output:
        type === "plus"
          ? x + y
          : type === "minus"
            ? x - y
            : type === "divides"
              ? x / y
              : type === "multiplies"
                ? x * y
                : 0,
    };
  });
  try {
    for (const e of expected) {
      const z: number = await driver[e.type](e.input[0], e.input[1]);
      TestValidator.equals("result", z, e.output);
    }
    await sleep_for(100);
    TestValidator.equals("events", events, expected);
  } catch (exp) {
    throw exp;
  } finally {
    await connector.close();
  }
};
