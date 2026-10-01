import { TestValidator } from "@nestia/e2e";
import path from "path";

/**
 * Verifies a DTO reference qualified by a namespace keeps every segment of a
 * nested name.
 *
 * `dto("IPage.IRequest", "api")` is documented to return the full name
 * qualified by the namespace, but only the first segment was kept, so the
 * reference named the file's outer type instead of the nested one.
 *
 * 1. Print a type alias whose body is the reference for a flat name, a nested name
 *    and a deeper one, each with and without a namespace.
 * 2. Assert the printed text spells the namespace and every segment.
 * 3. Assert the importer still records the first segment as the file to import.
 *
 * @evidence contracts/testing.md#behavioral-verification The reference is printed by the real TypeScript factory printer, so the assertion reads the qualified name that generated code would contain, and the recorded imports are read back through toStatements.
 * @evidence contracts/testing.md#independent-expectations The expected text is the dotted name TypeScript defines for a qualified type reference, written by hand for each input.
 * @evidence contracts/testing.md#distinguishing-cases Nested and deeper names with a namespace are the cases, the flat name with a namespace and every name without one are the unchanged controls, and the file recorded for import is the boundary that must stay the first segment.
 * @evidence contracts/testing.md#execution-ownership Unit: it runs in the shared test-migrate process against the built migrate library and factory printer, loaded by path; it creates no file and starts no process.
 */
export function test_migrate_import_dto_nested_namespace(): void {
  const root: string = path.resolve(
    process.cwd(),
    "..",
    "..",
    "packages",
    "migrate",
  );
  const { NestiaMigrateImportProgrammer } = require(
    path.join(root, "lib", "programmers", "NestiaMigrateImportProgrammer.js"),
  ) as {
    NestiaMigrateImportProgrammer: new () => {
      dto: (name: string, namespace?: string) => unknown;
      toStatements: (dtoPath: (name: string) => string) => unknown[];
    };
  };
  const { TsPrinter, factory } = require(
    require.resolve("@ttsc/factory", { paths: [root] }),
  ) as {
    TsPrinter: new () => { printFile: (a: undefined, s: unknown[]) => string };
    factory: {
      createTypeAliasDeclaration: (
        m: undefined,
        name: string,
        p: undefined,
        type: unknown,
      ) => unknown;
    };
  };
  const print = (name: string, namespace?: string): string => {
    const importer = new NestiaMigrateImportProgrammer();
    const alias = factory.createTypeAliasDeclaration(
      undefined,
      "X",
      undefined,
      importer.dto(name, namespace),
    );
    return new TsPrinter().printFile(undefined, [alias]).trim();
  };

  for (const [name, namespace, expected] of [
    ["IPage.IRequest", "api", "type X = api.IPage.IRequest;"],
    ["IA.IB.IC", "ns", "type X = ns.IA.IB.IC;"],
    ["IPage", "api", "type X = api.IPage;"],
    ["IPage.IRequest", undefined, "type X = IPage.IRequest;"],
    ["IPage", undefined, "type X = IPage;"],
    ["IPage.IRequest", "", "type X = IPage.IRequest;"],
  ] as const)
    TestValidator.equals(
      `${namespace ?? "-"}:${name}`,
      print(name, namespace).replace(/\s+/g, " "),
      expected,
    );

  const importer = new NestiaMigrateImportProgrammer();
  importer.dto("IPage.IRequest", "api");
  const imported: string = new TsPrinter().printFile(
    undefined,
    importer.toStatements((name: string) => `./${name}`),
  );
  TestValidator.predicate(
    "the file to import is the first segment",
    imported.includes('"./IPage"') && imported.includes("IPage"),
  );
}
