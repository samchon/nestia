import path from "path";
import { HashMap } from "tstl";
import ts from "typescript";
import { CommentFactory } from "typia/lib/factories/CommentFactory";

import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperation } from "../structures/IReflectHttpOperation";
import { ITypeTuple } from "../structures/ITypeTuple";
import { ITypedHttpRoute } from "../structures/ITypedHttpRoute";
import { PathUtil } from "../utils/PathUtil";
import { VersioningStrategy } from "../utils/VersioningStrategy";
import { ExceptionAnalyzer } from "./ExceptionAnalyzer";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { SecurityAnalyzer } from "./SecurityAnalyzer";

export namespace TypedHttpOperationAnalyzer {
  export const analyze =
    (project: INestiaProject) =>
    (props: {
      controller: IReflectController;
      operation: IReflectHttpOperation;
      declaration: ts.MethodDeclaration;
      symbol: ts.Symbol;
      generics: GenericAnalyzer.Dictionary;
    }): ITypedHttpRoute[] => {
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
      const parameters: Array<ITypedHttpRoute.IParameter | null> =
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
      const outputType: ITypeTuple | null = ImportAnalyzer.analyze(
        project.checker,
      )({
        generics: props.generics,
        imports: importDict,
        type: signature.getReturnType(),
      });
      if (
        outputType === null ||
        (project.config.clone !== true &&
          (outputType.typeName === "__type" ||
            outputType.typeName === "__object"))
      ) {
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.operation.name,
          message: "implicit (unnamed) return type.",
        });
        return [];
      } else if (
        props.operation.method === "HEAD" &&
        outputType.typeName !== "void" &&
        outputType.typeName !== "undefined"
      ) {
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.operation.name,
          message: `HEAD method must return void type.`,
        });
        return [];
      }

      const exceptions = ExceptionAnalyzer.analyze(project)({
        generics: props.generics,
        imports: project.config.propagate === true ? importDict : new HashMap(),
        controller: props.controller,
        operation: props.operation,
        declaration: props.declaration,
      });
      const imports: [string, string[]][] = importDict
        .toJSON()
        .map((pair) => [pair.first, pair.second.toJSON()]);

      // CONSIDER SECURITY TAGS
      const security: Record<string, string[]>[] = SecurityAnalyzer.merge(
        ...props.controller.security,
        ...props.operation.security,
        ...jsDocTags
          .filter((tag) => tag.name === "security")
          .map((tag) =>
            tag.text === undefined
              ? [{}]
              : tag.text.map((text) => {
                  const line: string[] = text.text
                    .split(" ")
                    .filter((s) => s.trim())
                    .filter((s) => !!s.length);
                  if (line.length === 0) return {};
                  return {
                    [line[0]]: line.slice(1),
                  };
                }),
          )
          .flat(),
      );

      // CONSTRUCT COMMON DATA
      const common: Omit<ITypedHttpRoute, "path" | "accessors"> = {
        ...props.operation,
        controller: props.controller,
        parameters: parameters.filter(
          (p) => p !== null,
        ) as ITypedHttpRoute.IParameter[],
        output: {
          type: outputType.type,
          typeName: outputType.typeName,
          contentType: props.operation.contentType,
        },
        imports,
        status: props.operation.status,
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
        operationId: jsDocTags
          .find(({ name }) => name === "operationId")
          ?.text?.[0].text.split(" ")[0]
          .trim(),
        jsDocTags: jsDocTags,
        setHeaders: jsDocTags
          .filter(
            (t) =>
              t.text?.length &&
              t.text[0].text &&
              (t.name === "setHeader" || t.name === "assignHeaders"),
          )
          .map((t) =>
            t.name === "setHeader"
              ? {
                  type: "setter",
                  source: t.text![0].text.split(" ")[0].trim(),
                  target: t.text![0].text.split(" ")[1]?.trim(),
                }
              : {
                  type: "assigner",
                  source: t.text![0].text,
                },
          ),
        security,
        exceptions,
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
            method: props.operation.method,
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
      parameter: IReflectHttpOperation.IParameter;
      symbol: ts.Symbol;
    }): ITypedHttpRoute.IParameter | null => {
      const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
        props.symbol,
        props.symbol.valueDeclaration!,
      );
      const name: string = props.symbol.getEscapedName().toString();
      const optional: boolean = !!project.checker.symbolToParameterDeclaration(
        props.symbol,
        undefined,
        undefined,
      )?.questionToken;

      const errors: IErrorReport[] = [];

      // DO NOT SUPPORT BODY PARAMETER
      if (
        props.parameter.category === "body" &&
        props.parameter.field !== undefined
      )
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message:
            `nestia does not support body field specification. ` +
            `Therefore, erase the "${name}" parameter and ` +
            `re-define a new body decorator accepting full structured message.`,
        });
      if (optional === true && props.parameter.category !== "query")
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message:
            `nestia does not support optional parameter except query parameter. ` +
            `Therefore, erase question mark on the "${name}" parameter, ` +
            `or re-define a new method without the "${name}" parameter.`,
        });
      if (
        optional === true &&
        props.parameter.category === "query" &&
        props.parameter.field === undefined
      )
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message:
            `nestia does not support optional query parameter without field specification. ` +
            `Therefore, erase question mark on the "${name}" parameter, ` +
            `or re-define re-define parameters for each query parameters.`,
        });

      // GET TYPE NAME
      const tuple: ITypeTuple | null = ImportAnalyzer.analyze(project.checker)({
        generics: props.generics,
        imports: props.imports,
        type,
      });
      if (
        tuple === null ||
        (project.config.clone !== true &&
          (tuple.typeName === "__type" || tuple.typeName === "__object"))
      )
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message: `implicit (unnamed) parameter type from "${name}".`,
        });
      if (errors.length) {
        project.errors.push(...errors);
        return null;
      }
      return {
        ...props.parameter,
        name,
        optional,
        type: tuple!.type,
        typeName: tuple!.typeName,
      };
    };
}
