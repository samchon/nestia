import { TestValidator } from "@nestia/e2e";
import fs from "fs";

/**
 * Reads generated status/random response and asserts status 300 has an
 * IBbsArticle JSON schema reference.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads generated status/random response and asserts status 300 has an IBbsArticle JSON schema reference.
 * @evidence contracts/testing.md#independent-expectations The authored HttpCode(300) and IBbsArticle return require this response status and schema independently of generated output.
 * @evidence contracts/testing.md#distinguishing-cases A nondefault 300 status distinguishes honoring HttpCode from a default 200 response; a sibling SDK status case verifies metadata and runtime consumption.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under status/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The status fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. A nondefault 300 status distinguishes honoring HttpCode from a default 200 response; a sibling SDK status case verifies metadata and runtime consumption.
 */
export const test_swagger = async () => {
  const content = JSON.parse(
    await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"),
  );
  const route = content.paths["/status/random"].get;

  TestValidator.equals(
    "300",
    route.responses["300"].content["application/json"].schema.$ref,
    "#/components/schemas/IBbsArticle",
  );
};
