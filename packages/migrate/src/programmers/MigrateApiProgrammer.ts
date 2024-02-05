import { HashMap, IPointer, hash } from "tstl";
import ts from "typescript";
import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateProgram } from "../module";
import { IMigrateFile } from "../structures/IMigrateFile";
import { FilePrinter } from "../utils/FilePrinter";
import { StringUtil } from "../utils/StringUtil";
import { MigrateApiFileProgrammer } from "./MigrateApiFileProgrammer";
import { MigrateDtoProgrammer } from "./MigrateDtoProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiProgrammer {
  export const write = (program: IMigrateProgram): IMigrateFile[] => {
    const dict: HashMap<string[], MigrateApiFileProgrammer.IProps> =
      new HashMap(
        (x) => hash(x.join(".")),
        (a, b) => a.join(".") === b.join("."),
      );
    for (const controller of program.controllers)
      for (const route of controller.routes) {
        const namespace: string[] = [
          ...controller.path.split("/"),
          ...route.path.split("/"),
        ]
          .filter((str) => !!str.length && str[0] !== ":")
          .map(StringUtil.normalize)
          .map((str) => (Escaper.variable(str) ? str : `_${str}`));
        const last: IPointer<MigrateApiFileProgrammer.IProps> = {
          value: dict.take(namespace, () => ({
            namespace,
            children: new Set(),
            entries: [],
          })),
        };
        last.value.entries.push({
          controller,
          route,
          alias: route.name,
        });
        namespace.slice(0, -1).forEach((_i, i, array) => {
          const partial: string[] = namespace.slice(0, array.length - i);
          const props: MigrateApiFileProgrammer.IProps = dict.take(
            partial,
            () => ({
              namespace: partial,
              children: new Set(),
              entries: [],
            }),
          );
          props.children.add(last.value.namespace.at(-1)!);
          last.value = props;
        });
        const top = dict.take([], () => ({
          namespace: [],
          children: new Set(),
          entries: [],
        }));
        if (namespace.length) top.children.add(namespace[0]);
      }
    for (const { second: props } of dict)
      props.entries.forEach((entry, i) => {
        entry.alias = StringUtil.escapeDuplicate([
          ...props.children,
          ...entry.route.parameters.map((p) => p.key),
          ...(entry.route.body ? [entry.route.body.key] : []),
          ...(entry.route.query ? [entry.route.query.key] : []),
          ...props.entries.filter((_, j) => i !== j).map((e) => e.alias),
        ])(entry.alias);
        entry.route.accessor = [...props.namespace, entry.alias];
      });

    const output: IMigrateFile[] = [...dict].map(({ second: props }) => ({
      location: `src/${program.mode === "nest" ? "api/" : ""}functional/${props.namespace.join("/")}`,
      file: "index.ts",
      content: FilePrinter.write({
        statements: MigrateApiFileProgrammer.write(program)(
          program.swagger.components,
        )(props),
      }),
    }));
    if (program.mode === "sdk")
      output.push(
        ...[
          ...MigrateDtoProgrammer.write(program.swagger.components).entries(),
        ].map(([key, value]) => ({
          location: "src/structures",
          file: `${key}.ts`,
          content: FilePrinter.write({
            statements: writeDtoFile(key, value),
          }),
        })),
      );
    return output;
  };

  const writeDtoFile = (
    key: string,
    modulo: MigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const importer = new MigrateImportProgrammer();
    const statements: ts.Statement[] = iterate(importer)(modulo);
    if (statements.length === 0) return [];

    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      ...statements,
    ];
  };

  const iterate =
    (importer: MigrateImportProgrammer) =>
    (modulo: MigrateDtoProgrammer.IModule): ts.Statement[] => {
      const output: ts.Statement[] = [];
      if (modulo.programmer !== null) output.push(modulo.programmer(importer));
      if (modulo.children.size) {
        const internal: ts.Statement[] = [];
        for (const child of modulo.children.values())
          internal.push(...iterate(importer)(child));
        output.push(
          ts.factory.createModuleDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createIdentifier(modulo.name),
            ts.factory.createModuleBlock(internal),
            ts.NodeFlags.Namespace,
          ),
        );
      }
      return output;
    };
}
