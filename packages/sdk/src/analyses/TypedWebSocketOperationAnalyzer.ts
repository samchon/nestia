import path from "path";
import { HashMap } from "tstl";
import ts from "typescript";
import { CommentFactory } from "typia/lib/factories/CommentFactory";

import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ITypedWebSocketRoute } from "../structures/ITypedWebSocketRoute";
import { PathUtil } from "../utils/PathUtil";
import { VersioningStrategy } from "../utils/VersioningStrategy";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";

export namespace TypedWebSocketOperationAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    (props: {
      controller: IReflectController;
      operation: IReflectWebSocketOperation;
      declaration: ts.MethodDeclaration;
      symbol: ts.Symbol;
      generics: GenericAnalyzer.Dictionary;
    }): ITypedWebSocketRoute[] => {
      // CHECK TYPE
      const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
        props.symbol,
        props.symbol.valueDeclaration!,
      );
      const signature: ts.Signature | undefined =
        project.checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
      if (signature === undefined) {
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.operation.name,
          message: "unable to get the type signature.",
        });
        return [];
      }

      // SKIP @IGNORE TAG
      const jsDocTags = signature.getJsDocTags();
      if (jsDocTags.some((tag) => tag.name === "ignore")) return [];

      // EXPLORE CHILDREN TYPES
      const importDict: ImportAnalyzer.Dictionary = new HashMap();
      const parameters: Array<ITypedWebSocketRoute.IParameter> =
        props.operation.parameters.map(
          (param) =>
            _Analyze_parameter(project)({
              generics: props.generics,
              imports: importDict,
              controller: props.controller,
              function: props.operation.name,
              parameter: param,
              symbol: signature.getParameters()[param.index],
            })!,
        );
      const imports: [string, string[]][] = importDict
        .toJSON()
        .map((pair) => [pair.first, pair.second.toJSON()]);
      const common: Omit<ITypedWebSocketRoute, "path" | "accessors"> = {
        ...props.operation,
        controller: props.controller,
        parameters,
        imports,
        location: (() => {
          const file = props.declaration.getSourceFile();
          const { line, character } = file.getLineAndCharacterOfPosition(
            props.declaration.pos,
          );
          return `${path.relative(process.cwd(), file.fileName)}:${line + 1}:${
            character + 1
          }`;
        })(),
        description: CommentFactory.description(props.symbol),
      };

      // CONFIGURE PATHS
      const pathList: Set<string> = new Set();
      const versions: string[] = VersioningStrategy.merge(project)([
        ...(props.controller.versions ?? []),
        ...(props.operation.versions ?? []),
      ]);
      for (const prefix of props.controller.prefixes)
        for (const cPath of props.controller.paths)
          for (const filePath of props.operation.paths)
            pathList.add(PathAnalyzer.join(prefix, cPath, filePath));

      return [...pathList]
        .map((individual) =>
          PathAnalyzer.combinate(project.input.globalPrefix)(
            [...versions].map((v) =>
              v === null
                ? null
                : project.input.versioning?.prefix?.length
                  ? `${project.input.versioning.prefix}${v}`
                  : v,
            ),
          )({
            method: "get",
            path: individual,
          }),
        )
        .flat()
        .filter((path) => {
          const escaped: string | null = PathAnalyzer.escape(path);
          if (escaped === null)
            project.errors.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.operation.name,
              message: `unable to escape the path "${path}".`,
            });
          return escaped !== null;
        })
        .map((path) => ({
          ...common,
          path: PathAnalyzer.escape(path)!,
          accessors: [...PathUtil.accessors(path), props.operation.name],
        }));
    };

  const _Analyze_parameter =
    (project: INestiaProject) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: ImportAnalyzer.Dictionary;
      controller: IReflectController;
      function: string;
      parameter: IReflectWebSocketOperation.IParameter;
      symbol: ts.Symbol;
    }): ITypedWebSocketRoute.IParameter => {};
}
