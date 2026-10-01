import { TestValidator } from "@nestia/e2e";
import fs from "fs";
import path from "path";
import { OpenApi } from "typia";

/**
 * Verifies each operation's `security` keeps the declared alternatives, and
 * each alternative's schemes and scopes, as OpenAPI reads them.
 *
 * In OpenAPI `security` lists alternatives, any one of which suffices, and
 * every scheme of one alternative must hold. The SDK merged all requirements
 * into one alternative per scheme name: `{ bearer, key }` (both) became
 * `bearer` or `key` (weaker), and the `read` or `write` scope alternatives
 * became one requirement of both scopes (stronger) (#1675).
 *
 * 1. Read each operation of the generated document.
 * 2. Assert its alternatives, the controller's included, compared as a set.
 *
 * @evidence contracts/testing.md#behavioral-verification Five operations must preserve exact AND/OR security alternatives, controller bearer, scope grouping, optional empty alternative and repeated-requirement deduplication.
 * @evidence contracts/testing.md#independent-expectations Authored decorators prescribe both bearer/key together, separate read/write alternatives, combined scopes, anonymous option and repetition. Handwritten objects supply the oracle; sorting only ignores scheme/alternative order.
 * @evidence contracts/testing.md#distinguishing-cases Both versus either versus scoped versus optional versus repeated requirements distinguish weakening/strengthening and duplicate changes.
 * @evidence contracts/testing.md#execution-ownership The feature executor discovers and awaits test_security_requirements after generation/emission. The simulate expression arrows return their assertion promises, so asynchronous rejection belongs to the report; zero discovery and any failed case fail the entry.
 * @evidence contracts/e2e.md#necessary-boundary Actual native decorator/tag metadata must reach the final serialized Swagger document; an isolated DTO or declaration inspection cannot certify operation security/status output.
 * @evidence contracts/e2e.md#shared-execution This case reuses packed dependencies, its compatible producer and emitted runtime, and the same generated document rather than compiling per assertion.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The read resolves from this emitted case to its own generated document. Local sorted security representations do not mutate the document; the feature/backend and copied outputs have entry/harness owners.
 * @evidence contracts/e2e.md#preserved-coverage The test_security_requirements selected inputs and output/status/document constraints above remain executable after shared preparation. Source-extension now also pins both literal payloads, and HEAD pins its void result; no retained invalid control is replaced by compilation success.
 */
export const test_security_requirements = async (): Promise<void> => {
  const document: OpenApi.IDocument = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../../swagger.json"), "utf8"),
  );
  const security = (name: string): string[] =>
    (document.paths?.[`/secure/${name}`]?.get?.security ?? [])
      .map((requirement) =>
        JSON.stringify(
          Object.entries(requirement).sort(([x], [y]) => x.localeCompare(y)),
        ),
      )
      .sort();
  const expected = (...requirements: Record<string, string[]>[]): string[] =>
    requirements
      .map((requirement) =>
        JSON.stringify(
          Object.entries(requirement).sort(([x], [y]) => x.localeCompare(y)),
        ),
      )
      .sort();

  TestValidator.equals(
    "both",
    security("both"),
    expected({ bearer: [] }, { bearer: [], key: [] }),
  );
  TestValidator.equals(
    "either",
    security("either"),
    expected({ bearer: [] }, { oauth2: ["read"] }, { oauth2: ["write"] }),
  );
  TestValidator.equals(
    "scoped",
    security("scoped"),
    expected({ bearer: [] }, { oauth2: ["read", "write"] }),
  );
  TestValidator.equals(
    "optional",
    security("optional"),
    expected({ bearer: [] }, {}),
  );
  TestValidator.equals(
    "repeated",
    security("repeated"),
    expected({ bearer: [] }),
  );
};
