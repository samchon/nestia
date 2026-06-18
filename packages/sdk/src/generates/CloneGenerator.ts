import {
  type Node,
  NodeFlags,
  type Statement,
  SyntaxKind,
  factory,
} from "@ttsc/factory";
import fs from "fs";

import { INestiaProject } from "../structures/INestiaProject";
import { ITypedApplication } from "../structures/ITypedApplication";
import { FilePrinter } from "./internal/FilePrinter";
import { ImportDictionary } from "./internal/ImportDictionary";
import { SdkHttpCloneProgrammer } from "./internal/SdkHttpCloneProgrammer";
import { SdkHttpCloneReferencer } from "./internal/SdkHttpCloneReferencer";
import { SdkWebSocketCloneProgrammer } from "./internal/SdkWebSocketCloneProgrammer";

export namespace CloneGenerator {
  export const write = async (app: ITypedApplication): Promise<void> => {
    const dict: Map<string, SdkHttpCloneProgrammer.IModule> =
      SdkHttpCloneProgrammer.write(app);
    const websocket: Set<string> = await SdkWebSocketCloneProgrammer.write(app);
    if (dict.size === 0 && websocket.size === 0) return;

    SdkHttpCloneReferencer.replace(app, websocket);
    try {
      await fs.promises.mkdir(`${app.project.config.output}/structures`);
    } catch {}
    for (const [key, value] of dict)
      await writeDtoFile(app.project)(key, value);
  };

  const writeDtoFile =
    (project: INestiaProject) =>
    async (
      key: string,
      value: SdkHttpCloneProgrammer.IModule,
    ): Promise<void> => {
      const location: string = `${project.config.output}/structures/${key}.ts`;
      const importer: ImportDictionary = new ImportDictionary(location);
      const statements: Node[] = iterate(importer)(value);
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
    (modulo: SdkHttpCloneProgrammer.IModule): Node[] => {
      const output: Node[] = [];
      if (modulo.programmer !== null) output.push(modulo.programmer(importer));
      if (modulo.children.size) {
        const internal: Node[] = [];
        for (const child of modulo.children.values())
          internal.push(...iterate(importer)(child));
        output.push(
          factory.createModuleDeclaration(
            [factory.createModifier(SyntaxKind.ExportKeyword)],
            factory.createIdentifier(modulo.name),
            factory.createModuleBlock(internal as Statement[]),
            NodeFlags.Namespace,
          ),
        );
      }
      return output;
    };
}
