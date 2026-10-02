import { TestValidator } from "@nestia/e2e";
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
 * route with no security emits `undefined`, which inherits any document-level
 * default; an empty array would override that default. Note that
 * `typia.assertEquals` is type-shaped, so the assertion locks the literal shape
 * of each requirement, not byte equality across pairs.
 *
 * 1. Read the generated `swagger.json` from the SDK output.
 * 2. Assert each `security` member matches the expected literal shape.
 * 3. Assert `/security` emits `undefined` (the absence test).
 *
 * @evidence contracts/testing.md#behavioral-verification Reads generated operation security, validates decorator/comment shapes, compares exact OAuth2 scopes and checks absent security on the unmarked route.
 * @evidence contracts/testing.md#independent-expectations Authored Basic, Bearer and OAuth2 decorators and security comments establish the requirement names and scope lists. Omitted security inherits document defaults; empty alternatives allow anonymous access.
 * @evidence contracts/testing.md#distinguishing-cases Decorator and comment twins, exact two-scope OAuth2 requirements, anonymous-plus-bearer alternatives and the absent field distinguish declaration sources and security-state semantics.
 * @evidence contracts/testing.md#execution-ownership The restored test-sdk installed-consumer harness discovers this exported test under security/src/test/features after generating and compiling that fixture.
 * @evidence contracts/e2e.md#necessary-boundary The assertion consumes generated SDK or Swagger artifacts from the real fixture producer; HTTP cases connect those artifacts to a live Nest application, while simulation cases connect generated validators to the installed fetcher runtime.
 * @evidence contracts/e2e.md#shared-execution The security fixture producer prepares its SDK, Swagger and consumer once for its discovered cases. This case performs no installation or compiler launch; distinct fixture inputs still have separate producer phases in the restored harness.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The fixture owns its generated directory and backend process; this case reads its artifacts and uses invocation-local assertions. Requests do not mutate persistent fixture data.
 * @evidence contracts/e2e.md#preserved-coverage The named assertions remain in this executable case; removed generic health/performance copies own no additional feature distinction. Decorator and comment twins, exact two-scope OAuth2 requirements, anonymous-plus-bearer alternatives and the absent field distinguish declaration sources and security-state semantics.
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
  for (const route of ["/oauth2", "/oauth2_by_comment"])
    TestValidator.equals(
      "declared OAuth2 scopes",
      swagger.paths[route].get.security.map(
        (requirement: { oauth2: string[] }) => ({
          oauth2: [...requirement.oauth2].sort(),
        }),
      ),
      [{ oauth2: ["read:pets", "write:pets"] }],
    );
  typia.assertEquals<[{}, { bearer: [] }]>(
    swagger.paths["/optional_by_comment"].get.security,
  );

  if (undefined !== (swagger.paths["/security"].get as any).security)
    throw Error("/security have to empty.");
};
