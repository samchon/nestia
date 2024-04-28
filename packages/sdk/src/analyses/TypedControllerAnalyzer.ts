import ts from "typescript";

import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { TypedHttpOperationAnalyzer } from "./TypedHttpOperationAnalyzer";
import { TypedWebSocketOperationAnalyzer } from "./TypedWebSocketOperationAnalyzer";

export namespace TypedControllerAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    async (
      sourceFile: ts.SourceFile,
      controller: IReflectController,
    ): Promise<Array<ITypedHttpRoute | ITypedWebSocketRoute>> => {
      // FIND CONTROLLER CLASS
      const ret: Array<ITypedHttpRoute | ITypedWebSocketRoute> = [];
      ts.forEachChild(sourceFile, (node) => {
        if (
          ts.isClassDeclaration(node) &&
          node.name?.escapedText === controller.name
        ) {
          // ANALYZE THE CONTROLLER
          ret.push(..._Analyze_controller(project)(controller, node));
          return;
        }
      });
      return ret;
    };

  /* ---------------------------------------------------------
        CLASS
    --------------------------------------------------------- */
  const _Analyze_controller =
    (project: INestiaProject) =>
    (
      controller: IReflectController,
      classNode: ts.ClassDeclaration,
    ): Array<ITypedHttpRoute | ITypedWebSocketRoute> => {
      const classType: ts.InterfaceType = project.checker.getTypeAtLocation(
        classNode,
      ) as ts.InterfaceType;
      const generics: GenericAnalyzer.Dictionary = GenericAnalyzer.analyze(
        project.checker,
        classNode,
      );

      const ret: Array<ITypedHttpRoute | ITypedWebSocketRoute> = [];
      for (const symbol of classType.getProperties()) {
        // GET METHOD DECLARATION
        const declaration: ts.Declaration | undefined = (symbol.declarations ||
          [])[0];
        if (!declaration || !ts.isMethodDeclaration(declaration)) continue;

        // IDENTIFIER MUST BE
        const identifier = declaration.name;
        if (!ts.isIdentifier(identifier)) continue;

        // ANALYZED WITH THE REFLECTED-FUNCTION
        const operation:
          | IReflectHttpOperation
          | IReflectWebSocketOperation
          | undefined = controller.operations.find(
          (f) => f.name === identifier.escapedText,
        );
        if (operation === undefined) continue;

        const routes: ITypedHttpRoute[] | ITypedWebSocketRoute[] =
          operation.protocol === "http"
            ? TypedHttpOperationAnalyzer.analyze(project)({
                controller,
                generics,
                operation,
                declaration,
                symbol,
              })
            : TypedWebSocketOperationAnalyzer.analyze(project)({
                controller,
                operation,
                declaration,
                symbol,
                generics,
              });
        ret.push(...routes);
      }
      return ret;
    };
}
