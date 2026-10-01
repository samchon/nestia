import { NestiaMigrateApplication } from "@nestia/migrate";
import { OpenApiV3_1 } from "@typia/interface";

/**
 * Verifies migrated controllers write each named example of a document nestia
 * itself generated back as the value it names.
 *
 * Nestia writes `@SwaggerExample` named examples as OpenAPI Example Objects
 * whose `value` holds the value (#1649), and migrate reads them back. This is
 * the round trip of the two packages: the document is the one `nestia swagger`
 * generated for the fixture project, not one written by hand. Documents of
 * earlier nestia versions and the other Example Object forms are owned by the
 * unit test `test_migrate_nest_named_examples_legacy`.
 *
 * 1. Migrate the fixture document nestia generated, whose create route declares
 *    named request-body and response examples.
 * 2. Assert the generated `SwaggerExample` calls carry the value, never the
 *    Example Object around it.
 *
 * @evidence contracts/testing.md#behavioral-verification It migrates the document `nestia swagger` generated for the fixture project and asserts the controller's `SwaggerExample` calls carry the values `minimal` and `published` and no Example Object wrapper.
 * @evidence contracts/testing.md#independent-expectations The expected values are the ones the fixture controller declares in its decorators, so the round trip is judged against the source of the document.
 * @evidence contracts/testing.md#distinguishing-cases Two named examples, a parameter and a response, are asserted; the other Example Object forms are owned by the unit test `test_migrate_nest_named_examples_legacy`.
 * @evidence contracts/testing.md#execution-ownership E2E: it runs in the E2E lane (`pnpm test:e2e`, the `test-migrate-e2e` suite), called by the suite entry `src/index.ts` after `nestia swagger` has generated the fixture document from a real project; the generated SDK and NestJS projects are compiled by `ttsc` in the same suite.
 * @evidence contracts/e2e.md#necessary-boundary The boundary is nestia's writer and migrate's reader meeting on a real document; a hand-written document cannot show that the two agree on the Example Object shape.
 * @evidence contracts/e2e.md#shared-execution It reuses the suite's single `nestia swagger` run of the fixture project and the one parsed document; it adds no generation or compilation of its own.
 * @evidence contracts/e2e.md#state-isolation-and-reuse-validity The document is read-only for it; `NestiaMigrateApplication.assert` builds a new application per call, so no mutation carries over.
 * @evidence contracts/e2e.md#preserved-coverage The synthetic-document assertions of the old combined test moved to `test-migrate` unchanged; this case keeps the part that needs the real document.
 */
export const test_migrate_nest_named_examples = (document: unknown): void => {
  const fixture: string = controller(
    NestiaMigrateApplication.assert(document as OpenApiV3_1.IDocument),
    "packages/backend/src/controllers/articles/ArticlesController.ts",
  );
  expect(fixture, [
    `SwaggerExample.Parameter("minimal",{title:"minimal",`,
    `SwaggerExample.Response("published",{id:"00000000-0000-0000-0000-000000000001",`,
  ]);
  if (fixture.includes("value:"))
    throw new Error("A named example kept its Example Object wrapper.");
};

/** The generated controller, without whitespace, whose layout is the printer's. */
const controller = (app: NestiaMigrateApplication, file: string): string => {
  const content: string | undefined = app.nest({
    keyword: false,
    simulate: false,
    e2e: false,
    package: "fixture",
  })[file];
  if (content === undefined) throw new Error(`Missing ${file}.`);
  return content.replace(/\s+/g, "");
};

const expect = (content: string, needles: string[]): void => {
  for (const needle of needles)
    if (content.includes(needle) === false)
      throw new Error(`Generated controller lacks ${JSON.stringify(needle)}.`);
};
