import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Verifies a Swagger 2.0 operation declares a body parameter exactly when the
 * body has a shape.
 *
 * Why: the same operation carries three media types -- the success response,
 * each declared exception, and the request body -- and the request one was the
 * last still written unconditionally. A body whose metadata yields no schema
 * produced `content: { "application/json": {} }`, which says "send me JSON" and
 * then declines to say what JSON. Its rule is also not the response's: a
 * response is described by a schema or an example, while a request body needs
 * the schema, so this pair cannot be folded into the response cases.
 *
 * 1. Read the generated 2.0 document.
 * 2. Assert the `void`-body route declares no body parameter at all, since Swagger
 *    2.0 renders a request body as a `body` parameter.
 * 3. Assert the shaped-body route beside it still declares one with a schema, so a
 *    composer that dropped every request body would not pass.
 */
export const test_openapi_v2_request_body_presence =
  async (): Promise<void> => {
    const swagger: any = JSON.parse(
      await fs.promises.readFile(`${__dirname}/../../../swagger.json`, "utf8"),
    );
    const bodyParameters = (path: string): any[] =>
      (swagger.paths[path].post.parameters ?? []).filter(
        (p: any) => p.in === "body",
      );

    TestValidator.equals(
      "void body declares no body parameter",
      bodyParameters("/health/empty").length,
      0,
    );

    const typed: any[] = bodyParameters("/health/typed");
    TestValidator.equals("shaped body declares one", typed.length, 1);
    TestValidator.predicate(
      "shaped body carries a schema",
      typed[0]?.schema !== undefined,
    );
  };
