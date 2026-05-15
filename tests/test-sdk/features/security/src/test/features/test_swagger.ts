import fs from "fs";
import typia from "typia";

/**
 * Verifies @SwaggerSecurity emits the correct OpenAPI security-requirement
 * shape per route, including the `undefined`-vs-`[]` distinction.
 *
 * Three load-bearing branches are pinned: (a) decorator-derived security
 * (`/basic`, `/bearer`, `/oauth2`) matches JSDoc-derived security
 * (`*_by_comment`) byte-for-byte, (b) `/optional_by_comment` emits
 * `[{}, { bearer: [] }]` where the `{}` is the "no auth" option, and
 * (c) the route with no security MUST emit `undefined` — NOT an empty
 * array, which OpenAPI would interpret as "apply the document-level
 * default."
 *
 *  1. Read the generated `swagger.json` from the SDK output.
 *  2. Assert each `security` member matches the expected literal shape.
 *  3. Assert `/security` emits `undefined` (the absence test).
 */
export const test_swagger = async () => {
  const swagger = JSON.parse(await fs.promises.readFile(__dirname + "/../../../swagger.json", "utf8"));
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
