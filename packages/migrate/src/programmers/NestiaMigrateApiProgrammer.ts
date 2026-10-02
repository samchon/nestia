import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";
import { HashMap, hash } from "tstl";

import ts from "../internal/ts";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateApiFileProgrammer } from "./NestiaMigrateApiFileProgrammer";
import { NestiaMigrateDtoProgrammer } from "./NestiaMigrateDtoProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

/**
 * Generates the functional API files and, for an SDK project, the DTO structure
 * files.
 *
 * @evidence contracts/common.md#principled-implementation Routes are grouped by namespace path in a hash map, each parent namespace is given its child, and each namespace becomes one `index.ts`; the DTO files are written per top-level component name.
 * @evidence contracts/common.md#clear-and-simple-design One entry function and two private helpers for the DTO files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The layout follows the accessors of the routes.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateApiProgrammer {
  /**
   * Returns the map from file path to content of the functional API, with the
   * DTO files for an SDK project.
   *
   * @evidence contracts/common.md#principled-implementation The grouping creates every ancestor namespace so that each level has an index, and the paths differ between the two modes only by their root.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The layout follows the accessors.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const write = (ctx: INestiaMigrateContext): Record<string, string> => {
    const dict: HashMap<string[], NestiaMigrateApiFileProgrammer.IProps> =
      new HashMap(
        (x) => hash(x.join(".")),
        (x, y) => x.length === y.length && x.join(".") === y.join("."),
      );
    dict.take([], () => ({
      config: ctx.config,
      components: ctx.application.document().components,
      namespace: [],
      routes: [],
      children: new Set(),
    }));
    for (const route of ctx.application.routes) {
      const namespace: string[] = route.accessor.slice(0, -1);
      let last: NestiaMigrateApiFileProgrammer.IProps = dict.take(
        namespace,
        () => ({
          config: ctx.config,
          components: ctx.application.document().components,
          namespace,
          routes: [],
          children: new Set(),
        }),
      );
      last.routes.push(route);
      namespace.forEach((_s, i, array) => {
        const partial: string[] = namespace.slice(0, array.length - i - 1);
        const props: NestiaMigrateApiFileProgrammer.IProps = dict.take(
          partial,
          () => ({
            config: ctx.config,
            components: ctx.application.document().components,
            namespace: partial,
            children: new Set(),
            routes: [],
          }),
        );
        props.children.add(last.namespace.at(-1)!);
        last = props;
      });
    }

    // DO GENERATE
    const files: Record<string, string> = Object.fromEntries(
      dict.toJSON().map(({ second: value }) => [
        `${ctx.mode === "nest" ? "packages/api/src" : "src"}/functional/${[...value.namespace, "index.ts"].join("/")}`,
        FilePrinter.write({
          statements: NestiaMigrateApiFileProgrammer.write({
            ...value,
            config: ctx.config,
            components: ctx.application.document().components,
          }),
        }),
      ]),
    );
    if (ctx.mode === "sdk")
      for (const [key, value] of NestiaMigrateDtoProgrammer.compose({
        config: ctx.config,
        components: ctx.application.document().components,
      }).entries())
        files[`src/structures/${key}.ts`] = FilePrinter.write({
          statements: writeDtoFile(key, value),
        });
    return files;
  };

  const writeDtoFile = (
    key: string,
    modulo: NestiaMigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const importer = new NestiaMigrateImportProgrammer();
    const statements: ts.Statement[] = iterate(importer, modulo);
    if (statements.length === 0) return [];
    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      ...statements,
    ];
  };

  const iterate = (
    importer: NestiaMigrateImportProgrammer,
    modulo: NestiaMigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const output: ts.Statement[] = [];
    if (modulo.programmer !== null) output.push(modulo.programmer(importer));
    if (modulo.children.size !== 0) {
      const internal: ts.Statement[] = [];
      for (const child of modulo.children.values())
        internal.push(...iterate(importer, child));
      output.push(
        factory.createModuleDeclaration(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createIdentifier(modulo.name),
          factory.createModuleBlock(internal),
          NodeFlags.Namespace,
        ),
      );
    }
    output.push(FilePrinter.newLine());
    return output;
  };
}
