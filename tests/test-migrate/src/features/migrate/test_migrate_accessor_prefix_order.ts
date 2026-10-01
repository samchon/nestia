import { TestValidator } from "@nestia/e2e";
import type { NestiaMigrateApplication as MigrateApplication } from "@nestia/migrate";
import type { OpenApiV3_1 } from "@typia/interface";
import path from "path";

/**
 * Verifies accessor conflict escaping preserves route-order precedence and
 * observes earlier routes after their accessors have changed.
 *
 * @evidence contracts/testing.md#behavioral-verification Real sdk and nest generation produce literal expected e2e filenames/calls for competing shorter prefixes and repeated underscore collisions, while the original analyzed accessor arrays remain unchanged. Empty and singleton populations retain their expected generated API behavior.
 * @evidence contracts/testing.md#independent-expectations The historical contract selects the first shorter matching route in route order, prefixes its last segment and repeats against the current routes. Authored expected names distinguish that order from choosing the shortest prefix or ignoring prior mutations; expected values are not generated with the implementation.
 * @evidence contracts/testing.md#distinguishing-cases A longer route preceding two shorter prefixes requires the earlier longer prefix first; an underscore-prefixed neighboring route requires another escape. A route with an adjacent different segment stays unchanged, and empty/singleton populations bound the case matrix. Both SDK and Nest modes consume the same naming result.
 * @evidence contracts/testing.md#execution-ownership Unit: test-migrate invokes the built migration owner and inspects generated in-memory file maps. It installs no consumer, starts no host and compiles no generated source.
 */
export const test_migrate_accessor_prefix_order = (): void => {
  const { NestiaMigrateApplication } = require(
    path.resolve(
      process.cwd(),
      "../../packages/migrate/lib/NestiaMigrateApplication.js",
    ),
  ) as { NestiaMigrateApplication: typeof MigrateApplication };
  for (const fixture of [
    { input: [] as string[][], expected: [] as string[][] },
    { input: [["single"]], expected: [["single"]] },
    {
      input: [
        ["a", "b", "c"],
        ["a", "b"],
        ["a", "_b"],
        ["a"],
        ["a", "bc", "neighbor"],
      ],
      expected: [
        ["_a", "__b", "c"],
        ["_a", "b"],
        ["_a", "_b"],
        ["a"],
        ["_a", "bc", "neighbor"],
      ],
    },
  ]) {
    const document: OpenApiV3_1.IDocument = {
      openapi: "3.1.0",
      info: { title: "Accessor prefix order", version: "1" },
      paths: Object.fromEntries(
        fixture.input.map((_accessor, index) => [
          `/fixture${index}`,
          {
            get: {
              operationId: `fixture${index}`,
              responses: {
                "200": {
                  description: "ok",
                  content: {
                    "application/json": { schema: { type: "string" } },
                  },
                },
              },
            },
          },
        ]),
      ),
    };
    const app = NestiaMigrateApplication.assert(document);
    const routes = app
      .getData()
      .routes.filter((route) => route.method !== "query");
    routes.forEach((route, index) => {
      route.accessor = [...fixture.input[index]!];
    });
    const config = { keyword: true, simulate: false, e2e: true };
    for (const [mode, files] of [
      ["sdk", app.sdk(config)],
      ["nest", app.nest(config)],
    ] as const) {
      const root =
        mode === "sdk"
          ? "test/features/api"
          : "packages/backend/test/features/api";
      for (const accessor of fixture.expected) {
        const file = files[`${root}/test_api_${accessor.join("_")}.ts`];
        TestValidator.predicate(
          `${mode} preserved ordered accessor ${accessor.join(".")}`,
          file?.includes(`api.functional.${accessor.join(".")}`) === true,
        );
      }
    }
    TestValidator.equals(
      "source accessors unchanged",
      routes.map((route) => route.accessor),
      fixture.input,
    );
  }
};
