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
 * @evidence contracts/testing.md#behavioral-verification Fresh Swagger output retains exact basic/bearer alternatives, both exact OAuth2 scopes, anonymous plus bearer and undefined absence from actual decorator and JSDoc metadata.
 * @evidence contracts/testing.md#independent-expectations Original literal requirement types, authored OAuth2 scope pair and OpenAPI anonymous/inheritance semantics establish the expected values independently of emitted output.
 * @evidence contracts/testing.md#distinguishing-cases Each reflected security declaration has its JSDoc counterpart; exact OAuth2 scope sets exclude lost scopes, and anonymous access contrasts with absent authentication. Invalid scheme/scope/version decisions are separately owned by direct SDK generator units.
 * @evidence contracts/testing.md#execution-ownership The matching exported case runs in the installed shared consumer and reads the newly generated document from the actual producer/application.
 * @evidence contracts/e2e.md#necessary-boundary Actual default Nest Swagger decorators and compiled JSDoc metadata must reach the public generator; authored route units cannot establish that reflection connection.
 * @evidence contracts/e2e.md#shared-execution The existing installed consumer, producer, generation, consumer compilation and application serve all security routes and other rich cases once.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity Scenario-prefixed stateless routes retain default scheme names and exact scope identities; fresh output is case-local and the shared application closes in finally.
 * @evidence contracts/e2e.md#preserved-coverage Every original security/test_swagger assertion remains with only recorded case, route and document-location identities changed. The original four exact scheme definitions are retained in shared configuration; direct units separately verify scheme definitions, invalid controls and default operationId selection.
 */
export const test_swagger_security = async () => {
  const swagger = JSON.parse(
    await fs.promises.readFile(
      __dirname + "/../../../../../swagger.json",
      "utf8",
    ),
  );
  typia.assertEquals<[{ basic: [] }]>(
    swagger.paths["/http_rich/security/basic"].get.security,
  );
  typia.assertEquals<[{ basic: [] }]>(
    swagger.paths["/http_rich/security/basic_by_comment"].get.security,
  );
  typia.assertEquals<[{ bearer: [] }]>(
    swagger.paths["/http_rich/security/bearer"].get.security,
  );
  typia.assertEquals<[{ bearer: [] }]>(
    swagger.paths["/http_rich/security/bearer_by_comment"].get.security,
  );
  typia.assertEquals<[{ oauth2: ("write:pets" | "read:pets")[] }]>(
    swagger.paths["/http_rich/security/oauth2"].get.security,
  );
  typia.assertEquals<[{ oauth2: ("write:pets" | "read:pets")[] }]>(
    swagger.paths["/http_rich/security/oauth2_by_comment"].get.security,
  );
  for (const route of [
    "/http_rich/security/oauth2",
    "/http_rich/security/oauth2_by_comment",
  ])
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
    swagger.paths["/http_rich/security/optional_by_comment"].get.security,
  );

  if (
    undefined !==
    (swagger.paths["/http_rich/security/security"].get as any).security
  )
    throw Error("/security have to empty.");
};
