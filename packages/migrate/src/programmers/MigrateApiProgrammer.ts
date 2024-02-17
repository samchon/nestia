import { HashMap, IPointer, hash } from "tstl";
import ts from "typescript";
import { Escaper } from "typia/lib/utils/Escaper";

import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateFile } from "../structures/IMigrateFile";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { FilePrinter } from "../utils/FilePrinter";
import { StringUtil } from "../utils/StringUtil";
import { MigrateApiFileProgrammer } from "./MigrateApiFileProgrammer";
import { MigrateDtoProgrammer } from "./MigrateDtoProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiProgrammer {
  export const write = (program: IMigrateProgram): IMigrateFile[] => {
    // GROUP BY NAMESPACES
    const dict: HashMap<string[], MigrateApiFileProgrammer.IProps> = collect(
      ({ controller, route }) =>
        [...controller.path.split("/"), ...route.path.split("/")]
          .filter((str) => !!str.length && str[0] !== ":")
          .map(StringUtil.normalize)
          .map((str) => (Escaper.variable(str) ? str : `_${str}`)),
    )(program);

    // EMEND NAMES
    for (const { second: props } of dict)
      props.entries.forEach((entry, i) => {
        entry.alias = StringUtil.escapeDuplicate([
          ...props.children,
          ...props.entries.filter((_, j) => i !== j).map((e) => e.alias),
        ])(entry.alias);
        entry.route.accessor = [...props.namespace, entry.alias];

        const parameters: { name: string; key: string }[] = [
          ...entry.route.parameters,
          ...(entry.route.body ? [entry.route.body] : []),
          ...(entry.route.headers ? [entry.route.headers] : []),
          ...(entry.route.query ? [entry.route.query] : []),
        ];
        parameters.forEach(
          (p, i) =>
            (p.key = StringUtil.escapeDuplicate([
              "connection",
              entry.alias,
              ...parameters.filter((_, j) => i !== j).map((y) => y.key),
            ])(p.key)),
        );
      });

    // // GROUP BY NAMESPACES AGAIN
    // const refined: HashMap<string[], MigrateApiFileProgrammer.IProps> =
    //   collect(({ route }) => route.accessor.slice(0, -1))(program);

    // DO GENERATE
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
          ...MigrateDtoProgrammer.compose(program.swagger.components).entries(),
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

  const collect =
    (
      getter: (props: {
        controller: IMigrateController;
        route: IMigrateRoute;
      }) => string[],
    ) =>
    (
      program: IMigrateProgram,
    ): HashMap<string[], MigrateApiFileProgrammer.IProps> => {
      const dict: HashMap<string[], MigrateApiFileProgrammer.IProps> =
        new HashMap(Functional.hashCode, Functional.equals);
      for (const controller of program.controllers)
        for (const route of controller.routes) {
          const namespace: string[] = getter({ controller, route });
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
      return dict;
    };
}

const Functional = {
  hashCode: (x: string[]) => hash(x.join(".")),
  equals: (a: string[], b: string[]) => a.join(".") === b.join("."),
};
