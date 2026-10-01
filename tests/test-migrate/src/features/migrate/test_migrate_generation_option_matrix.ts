import { NestiaMigrateApplication } from "@nestia/migrate";
import type { OpenApiV3_1 } from "@typia/interface";
import assert from "assert/strict";

/**
 * Verifies migration options compose consistently in SDK and Nest generation.
 *
 * Compilation only shows whether an output is accepted. These direct writer
 * assertions distinguish ignored options from their adjacent disabled controls
 * while the shared E2E consumer retains generated-project compilation.
 *
 * 1. Analyze one optional-body operation with an independently authored response.
 * 2. Generate both modes with every keyword, simulation and e2e combination.
 * 3. Require exact optional-body syntax and simulator/e2e presence decisions.
 *
 * @evidence contracts/testing.md#behavioral-verification Actual SDK and Nest writers generate every three-boolean combination; optional keyword Props versus positional body syntax, simulation declaration and e2e file/call presence distinguish dropped or cross-wired options.
 * @evidence contracts/testing.md#independent-expectations OpenAPI requestBody.required=false permits omission. Public keyword, simulate and e2e options independently control their emitted declarations and files; literal items.post API references follow the authored operation's path/method.
 * @evidence contracts/testing.md#distinguishing-cases Both generation modes run all eight boolean combinations. Each enabled value has its adjacent disabled twin under identical other options, while the optional body remains optional throughout; richer request/schema/security semantics retain their separate owners.
 * @evidence contracts/testing.md#execution-ownership The test-migrate entry discovers this matching export. One analyzed application generates in-memory maps, with no project compilation, consumer installation, host, worker or CLI session. The shared migration E2E batch owns compilation and runtime connection.
 */
export const test_migrate_generation_option_matrix = (): void => {
  const document: OpenApiV3_1.IDocument = {
    openapi: "3.1.0",
    info: { title: "Generation options", version: "1" },
    paths: {
      "/items": {
        post: {
          requestBody: {
            required: false,
            content: { "application/json": { schema: { type: "string" } } },
          },
          responses: {
            "201": {
              description: "Created",
              content: { "application/json": { schema: { type: "string" } } },
            },
          },
        },
      },
    },
  };
  const app = NestiaMigrateApplication.assert(document);
  for (const mode of ["sdk", "nest"] as const)
    for (const keyword of [false, true])
      for (const simulate of [false, true])
        for (const e2e of [false, true]) {
          const label = `${mode} keyword=${keyword} simulate=${simulate} e2e=${e2e}`;
          const files = app[mode]({
            keyword,
            simulate,
            e2e,
            package: "fixture",
          });
          const root = mode === "sdk" ? "src" : "packages/api/src";
          const functional = files[`${root}/functional/items/index.ts`];
          assert.ok(functional, `${label}: functional output missing`);
          const normalized = functional.replace(/\s+/g, " ");
          assert.equal(
            normalized.includes("export type Props ="),
            keyword,
            `${label}: keyword declaration`,
          );
          assert.ok(
            normalized.includes(keyword ? "body?:" : "body?: post.Body"),
            `${label}: optional body`,
          );
          assert.equal(
            /export const simulate\s*=/.test(functional),
            simulate,
            `${label}: simulator`,
          );
          const tests = Object.entries(files).filter(([name]) =>
            /\/features\/api\/test_api_/.test(name),
          );
          assert.equal(
            tests.length,
            e2e ? 1 : 0,
            `${label}: generated e2e count`,
          );
          if (e2e) {
            assert.equal(
              tests[0]?.[0],
              mode === "sdk"
                ? "test/features/api/test_api_items_post.ts"
                : "packages/backend/test/features/api/test_api_items_post.ts",
              `${label}: e2e location`,
            );
            assert.ok(
              tests[0]?.[1].includes("api.functional.items.post"),
              `${label}: e2e API reference`,
            );
          }
        }
};
