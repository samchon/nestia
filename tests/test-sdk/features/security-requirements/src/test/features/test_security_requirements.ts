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
