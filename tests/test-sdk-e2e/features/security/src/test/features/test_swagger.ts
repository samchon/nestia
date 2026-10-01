import fs from "fs";
import typia from "typia";

/**
 * Verifies @ApiBasicAuth / @ApiBearerAuth / @ApiOAuth2 decorators emit the
 * correct OpenAPI security-requirement shape, including the `undefined`-vs-`[]`
 * distinction.
 *
 * Three load-bearing branches are pinned: (a) NestJS Swagger decorator routes
 * (`/basic`, `/bearer`, `/oauth2`) and their JSDoc-tagged counterparts
 * (`*_by_comment`) both populate `security`, (b) `/optional_by_comment` emits
 * `[{}, { bearer: [] }]` where the `{}` is the "no auth" option, and (c) the
 * route with no security emits `undefined`, inheriting any document-level
 * default. An empty array would instead remove that default. Note that
 * `typia.assertEquals` is type-shaped, so the assertion locks the literal shape
 * of each requirement, not byte equality across pairs.
 *
 * 1. Read the generated `swagger.json` from the SDK output.
 * 2. Assert each `security` member matches the expected literal shape.
 * 3. Assert `/security` emits `undefined` (the absence test).
 *
 * @evidence contracts/testing.md#behavioral-verification Decorator and JSDoc basic/bearer requirements must have exact tuple shapes; OAuth scopes belong to the two declared strings, optional allows anonymous, and absent security remains undefined.
 * @evidence contracts/testing.md#independent-expectations Authored security declarations and OpenAPI absence/anonymous semantics prescribe the literal shapes. OAuth checks membership rather than requiring both scopes or their order.
 * @evidence contracts/testing.md#distinguishing-cases Decorator/tag twins, optional empty alternative and absent property distinguish sources and absence; this case does not assert a document-level default or empty array override.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_swagger after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorator/tag metadata must reach the final serialized Swagger document; an isolated DTO or declaration inspection cannot certify operation security/status output.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and the same generated document rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The read resolves from this emitted case to its own generated document. Local sorted security representations do not mutate the document; the feature/backend and copied outputs have entry/harness owners.
 * @evidence contracts/e2e.md#preserved-coverage The test_swagger selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 * @see https://spec.openapis.org/oas/v3.1.0.html#operation-object
 */
export const test_swagger = async () => {
  const swagger = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  typia.assertEquals<[{ basic: [] }]>(swagger.paths["/basic"].get.security);
  typia.assertEquals<[{ basic: [] }]>(
    swagger.paths["/basic_by_comment"].get.security,
  );
  typia.assertEquals<[{ bearer: [] }]>(swagger.paths["/bearer"].get.security);
  typia.assertEquals<[{ bearer: [] }]>(
    swagger.paths["/bearer_by_comment"].get.security,
  );
  typia.assertEquals<[{ oauth2: ("write:pets" | "read:pets")[] }]>(
    swagger.paths["/oauth2"].get.security,
  );
  typia.assertEquals<[{ oauth2: ("write:pets" | "read:pets")[] }]>(
    swagger.paths["/oauth2_by_comment"].get.security,
  );
  typia.assertEquals<[{}, { bearer: [] }]>(
    swagger.paths["/optional_by_comment"].get.security,
  );

  if (undefined !== (swagger.paths["/security"].get as any).security)
    throw Error("/security have to empty.");
};
