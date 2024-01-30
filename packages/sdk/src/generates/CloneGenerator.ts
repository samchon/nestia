import fs from "fs";
import ts from "typescript";

import { INestiaConfig } from "../INestiaConfig";
import { IRoute } from "../structures/IRoute";
import { FilePrinter } from "./internal/FilePrinter";
import { ImportDictionary } from "./internal/ImportDictionary";
import { SdkInterfaceProgrammer } from "./internal/SdkCloneProgrammer";

export namespace SdkCloneProgrammer {
  export const write =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    async (routes: IRoute[]): Promise<void> => {
      const dict: Map<string, SdkInterfaceProgrammer.IModule> =
        SdkInterfaceProgrammer.write(checker)(config)(routes);
      try {
        await fs.promises.mkdir(`${config.output}/structures`);
      } catch {}
      for (const [key, value] of dict) await writeDtoFile(config)(key, value);
    };

  const writeDtoFile =
    (config: INestiaConfig) =>
    async (
      key: string,
      value: SdkInterfaceProgrammer.IModule,
    ): Promise<void> => {
      const location: string = `${config.output}/structures/${key}.ts`;
      const importer: ImportDictionary = new ImportDictionary(location);
      const statements: ts.Statement[] = iterate(importer)(value);
      if (statements.length === 0) return;

      await FilePrinter.write({
        location,
        statements: [
          ...importer.toStatements(`${config.output}/structures`),
          ...(importer.empty() ? [] : [FilePrinter.enter()]),
          ...statements,
        ],
      });
    };

  const iterate =
    (importer: ImportDictionary) =>
    (modulo: SdkInterfaceProgrammer.IModule): ts.Statement[] => {
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
