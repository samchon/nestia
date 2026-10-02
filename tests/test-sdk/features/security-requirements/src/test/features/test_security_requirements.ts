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
 * @evidence contracts/testing.md#behavioral-verification Reads generated security and compares normalized alternatives for both, either, scoped, optional and repeated routes.
 * @evidence contracts/testing.md#independent-expectations OpenAPI requires alternatives to be OR and schemes within one alternative to be AND; authored controller and route annotations supply literal expected requirement sets.
 * @evidence contracts/testing.md#distinguishing-cases Both schemes, separate scope alternatives, combined scopes, anonymous alternatives, inherited bearer and deduplication remain distinct; normalization ignores only requirement/object entry order.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under security-requirements/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The security-requirements fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Both schemes, separate scope alternatives, combined scopes, anonymous alternatives, inherited bearer and deduplication remain distinct; normalization ignores only requirement/object entry order.
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
