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

/**
 * Writes the DTO declarations of the SDK: the `structures` files that the
 * functions import when `clone` is on.
 *
 * @evidence contracts/common.md#principled-implementation The namespace composes the declarations from the analyzed types, rewrites the routes to reference them, and prints one file per top-level module.
 * @evidence contracts/common.md#clear-and-simple-design One public function with two private helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every declaration goes through the shared printer, and no type is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 */
export namespace CloneGenerator {
  /**
   * Writes the `structures` directory of the SDK output.
   *
   * Structural route references are updated even when every JSON DTO is inline
   * and no structure file is needed. WebSocket source cloning stays separate.
   *
   * @evidence contracts/common.md#principled-implementation HTTP and MCP JSON declarations share the analyzed collection; WebSocket sources are copied separately. Route references are updated even for inline-only graphs, then named modules are written sequentially so a failure stops at the first file.
   * @evidence contracts/common.md#clear-and-simple-design One function over the two programmers, the referencer, and the file writer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The directory is created recursively and its failure is not swallowed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   */
  export const write = async (app: ITypedApplication): Promise<void> => {
    const dict: Map<string, SdkHttpCloneProgrammer.IModule> =
      SdkHttpCloneProgrammer.write(app);
    const websocket: Set<string> = await SdkWebSocketCloneProgrammer.write(app);
    SdkHttpCloneReferencer.replace(app, websocket);
    if (dict.size === 0 && websocket.size === 0) return;
    await fs.promises.mkdir(`${app.project.config.output}/structures`, {
      recursive: true,
    });
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
