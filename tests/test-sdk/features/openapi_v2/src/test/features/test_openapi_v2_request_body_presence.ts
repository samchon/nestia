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
 * @evidence contracts/testing.md#behavioral-verification The generated void-body endpoint must have zero body parameters; the typed twin must have one body parameter carrying a schema.
 * @evidence contracts/testing.md#independent-expectations The authored controllers distinguish void input from IHealthInput; Swagger 2.0 represents request bodies as in: body parameters.
 * @evidence contracts/testing.md#distinguishing-cases Adjacent void and shaped request bodies distinguish correct omission from dropping every request schema.
 * @evidence contracts/testing.md#execution-ownership The feature src/test/index.ts discovers this exported case through DynamicExecutor after start.js generates and compiles its authored consumer; it belongs to the existing SDK integration population.
 * @evidence contracts/e2e.md#necessary-boundary The controller type metadata must reach the request-body composer and 2.0 converter; the emitted parameter population observes that connection.
 * @evidence contracts/e2e.md#shared-execution This case reuses its feature's generated document/client and Backend session with sibling cases. The current harness retains a distinct fixture program and backend lifecycle per feature; generation is not consolidated into one repository-wide producer.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The feature's artifact is read without mutation, or its authored echo endpoint returns invocation-local input. Backend cleanup belongs to the feature entry, which currently closes after discovery and lacks a finally around exceptional discovery.
 * @evidence contracts/e2e.md#preserved-coverage These focused assertions remain discoverable. Generic performance/health smoke duplicates removed from non-equals and operationId retain their HTTP/DTO owners in all; operationId now owns actual callback/tag assertions and non-equals gains surplus and invalid-property distinctions.
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
