import fs from "fs";
import ts from "typescript";

import { INestiaProject } from "../structures/INestiaProject";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { FilePrinter } from "./internal/FilePrinter";
import { ImportDictionary } from "./internal/ImportDictionary";
import { SdkHttpCloneProgrammer } from "./internal/SdkHttpCloneProgrammer";

export namespace CloneGenerator {
  export const write =
    (project: INestiaProject) =>
    async (routes: ITypedHttpRoute[]): Promise<void> => {
      const dict: Map<string, SdkHttpCloneProgrammer.IModule> =
        SdkHttpCloneProgrammer.write(project)(routes);
      if (dict.size === 0) return;
      try {
        await fs.promises.mkdir(`${project.config.output}/structures`);
      } catch {}
      for (const [key, value] of dict) await writeDtoFile(project)(key, value);
    };

  const writeDtoFile =
    (project: INestiaProject) =>
    async (
      key: string,
      value: SdkHttpCloneProgrammer.IModule,
    ): Promise<void> => {
      const location: string = `${project.config.output}/structures/${key}.ts`;
      const importer: ImportDictionary = new ImportDictionary(location);
      const statements: ts.Statement[] = iterate(importer)(value);
      if (statements.length === 0) return;

      await FilePrinter.write({
        location,
        statements: [
          ...importer.toStatements(`${project.config.output}/structures`),
          ...(importer.empty() ? [] : [FilePrinter.enter()]),
          ...statements,
        ],
      });
    };

  const iterate =
    (importer: ImportDictionary) =>
    (modulo: SdkHttpCloneProgrammer.IModule): ts.Statement[] => {
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
