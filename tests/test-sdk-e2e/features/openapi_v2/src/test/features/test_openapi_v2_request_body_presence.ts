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
 *
 * @evidence contracts/testing.md#behavioral-verification Generated void-body POST must contain zero body parameters, while the adjacent typed-body POST contains exactly one with a schema.
 * @evidence contracts/testing.md#independent-expectations Authored HealthController declares void versus IHealthInput bodies; Swagger2 represents a request body as a body parameter requiring a schema.
 * @evidence contracts/testing.md#distinguishing-cases Bodyless and shaped controls reject both unconditional media emission and dropping every body. The selected schema presence check does not independently verify its complete properties.
 * @evidence contracts/testing.md#execution-ownership The matching exported case is discovered and awaited by its actual feature entry after generation and consumer compilation. Type controls fail compilation and runtime assertions reject the report; empty discovery rejects the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native body metadata and2.0 request downgrade must connect to the final parameter list; success-response tests cannot establish the different request-body presence rule.
 * @evidence contracts/e2e.md#shared-execution The suite prepares one packed dependency installation and compatible producer/runtime programs. These cases reuse the feature backend and their generated artifacts; distinct parser/adaptor setup remains authored per feature rather than starting another install/compiler.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Values and generated artifacts belong to isolated copied feature trees. Extra adapter applications and connectors, where used, close in finally with listen inside ownership; the entry closes its backend and the harness removes only owned trees after consumers finish.
 * @evidence contracts/e2e.md#preserved-coverage All retained requests, raw protocol/document reads, compile controls and accepted/rejected assertions remain in this executable case and its stated sibling owners. Shared preparation does not substitute setup success for those observations.
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
