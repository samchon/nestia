import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import api from "@api";

/**
 * Verifies optional query arguments before a required body compile and work.
 *
 * An optional positional argument needs an explicit `undefined` type when a
 * required body follows it. A route without a later required argument can still
 * use `?`, and the simulator must share the same valid signature.
 *
 * 1. Call field and object routes with query values and with `undefined`.
 * 2. Check the generated function and simulator signatures.
 */
export const test_sdk_optional_before_required = async (
  connection: api.IConnection,
): Promise<void> => {
  const routes = api.functional.optional_query;
  TestValidator.equals(
    "field values",
    await routes.field(connection, "full", "end", { value: 3 }),
    "full:3:end",
  );
  TestValidator.equals(
    "field absent",
    await routes.field(connection, undefined, undefined, { value: 4 }),
    "none:4:none",
  );
  TestValidator.equals(
    "object values",
    await routes.object(connection, { mode: "full" }, { value: 5 }),
    "full:5",
  );
  TestValidator.equals(
    "object absent",
    await routes.object(connection, undefined, { value: 6 }),
    "none:6",
  );
  TestValidator.equals(
    "trailing optional",
    await routes.trailing(connection, "full"),
    "full:none",
  );

  const content: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/optional_query/index.ts`,
    "utf8",
  );
  TestValidator.equals(
    "field signature",
    content.includes(
      "mode: string | undefined,\n  suffix: string | undefined,\n  body: field.Body,",
    ),
    true,
  );
  TestValidator.equals(
    "field simulator",
    content.includes(
      "mode: string | undefined,\n    suffix: string | undefined,\n    body: Body,",
    ),
    true,
  );
  TestValidator.equals(
    "object signature",
    content.includes("query: object.Query | undefined,\n  body: object.Body,"),
    true,
  );
  TestValidator.equals(
    "trailing signature",
    content.includes("mode: string,\n  suffix?: string | undefined,"),
    true,
  );
};
