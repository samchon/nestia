import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import api from "@api";

/**
 * Verifies SDK functions of routes whose handlers destructure their parameters
 * send every argument, under names the SDK gives them.
 *
 * A destructured parameter, `@TypedBody() { title, body }: IArticleInput`,
 * declares no name. The SDK's metadata pass read the name as an identifier and
 * crashed on it, as it did on any decorated method in the program, route or not
 * (#1660). The SDK now names such a parameter after what it carries: its field
 * in camel case, else its category, apart from the handler's own parameter
 * names, which it keeps.
 *
 * 1. Call each route of `DestructuredController` and assert the echo, including
 *    the route that calls the traced, non-controller repository.
 * 2. Read the generated SDK and assert the parameter names: `body`, `query`,
 *    `pageSize` for the `page-size` query key, and `_body` beside the user's
 *    own `body` path parameter.
 */
export const test_sdk_destructured_http = async (
  connection: api.IConnection,
): Promise<void> => {
  const destructured = api.functional.destructured;
  TestValidator.equals(
    "body",
    await destructured.body(connection, { title: "t", body: "b" }),
    { title: "t", body: "b" },
  );
  TestValidator.equals(
    "query",
    await destructured.query(connection, { page: 3, keyword: "k" }),
    { page: 3, keyword: "k" },
  );
  TestValidator.equals(
    "headers",
    await destructured.headers({
      ...connection,
      headers: { "x-tenant": "tenant" },
    }),
    "tenant",
  );
  TestValidator.equals(
    "field",
    await destructured.field(connection, "abc"),
    "field",
  );
  TestValidator.equals(
    "collide",
    await destructured.collide(connection, "path", { title: "t", body: "b" }),
    ["path", "t"],
  );
  TestValidator.equals(
    "traced",
    await destructured.traced(connection),
    "traced",
  );

  const content: string = await fs.promises.readFile(
    `${__dirname}/../../api/functional/destructured/index.ts`,
    "utf8",
  );
  for (const needle of [
    "body: body.Body,",
    "query: query.Query,",
    "pageSize: string,",
    "body: string,\n  _body: collide.Body,",
  ])
    TestValidator.equals(needle, content.includes(needle), true);
};
