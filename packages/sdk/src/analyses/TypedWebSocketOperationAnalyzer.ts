import path from "path";
import { HashMap } from "tstl";
import ts from "typescript";
import { CommentFactory } from "typia/lib/factories/CommentFactory";

import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IReflectController } from "../structures/IReflectController";
import { IReflectWebSocketOperation } from "../structures/IReflectWebSocketOperation";
import { ITypeTuple } from "../structures/ITypeTuple";
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
      const errors: IErrorReport[] = [];
      const parameters: Array<ITypedWebSocketRoute.IParameter> =
        props.operation.parameters.map(
          (param) =>
            _Analyze_parameter({
              ...project,
              errors,
            })({
              generics: props.generics,
              imports: importDict,
              controller: props.controller,
              function: props.operation.name,
              parameter: param,
              symbol: signature.getParameters()[param.index],
            })!,
        );
      if (errors.length) {
        project.errors.push(...errors);
        return [];
      }

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
        jsDocTags,
      };

      // CONFIGURE PATHS
      const pathList: Set<string> = new Set();
      const versions: string[] = VersioningStrategy.merge(project)([
        ...(props.controller.versions ?? []),
        ...(props.operation.versions ?? []),
      ]);
      for (const v of versions)
        for (const prefix of wrapPaths(props.controller.prefixes))
          for (const cPath of wrapPaths(props.controller.paths))
            for (const filePath of wrapPaths(props.operation.paths))
              pathList.add(
                PathAnalyzer.join(
                  project.input.globalPrefix?.prefix ?? "",
                  v,
                  prefix,
                  cPath,
                  filePath,
                ),
              );

      return [...pathList]
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
    }): ITypedWebSocketRoute.IParameter => {
      if (props.parameter.category === "acceptor")
        return _Analyze_acceptor(project)(props);
      else if (props.parameter.category === "driver")
        return _Analyze_driver(project)(props);

      const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
        props.symbol,
        props.symbol.valueDeclaration!,
      );
      const name: string = props.symbol.getEscapedName().toString();

      // VALIDATIONS
      const errors: IErrorReport[] = [];
      const tuple: ITypeTuple | null = ImportAnalyzer.analyze(project.checker)({
        generics: props.generics,
        imports: props.imports,
        type,
      });
      if (
        tuple === null ||
        tuple.typeName === "__type" ||
        tuple.typeName === "__object"
      )
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message: `implicit (unnamed) parameter type from ${JSON.stringify(name)}.`,
        });
      _Check_optional({
        ...project,
        errors,
      })({
        ...props,
        parameter: {
          name,
          symbol: props.symbol,
        },
      });
      if (errors.length) {
        project.errors.push(...errors);
        return null!;
      }
      return {
        ...props.parameter,
        category: props.parameter.category,
        name,
        type: tuple!.type,
        typeName: tuple!.typeName,
      };
    };

  const _Analyze_acceptor =
    (project: INestiaProject) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: ImportAnalyzer.Dictionary;
      controller: IReflectController;
      function: string;
      parameter: IReflectWebSocketOperation.IParameter;
      symbol: ts.Symbol;
    }): ITypedWebSocketRoute.IAcceptorParameter => {
      // VALIDATIONS
      const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
        props.symbol,
        props.symbol.valueDeclaration!,
      );
      const name: string = props.symbol.getEscapedName().toString();
      const generics: readonly ts.Type[] =
        type.aliasTypeArguments ??
        project.checker.getTypeArguments(type as ts.TypeReference) ??
        [];

      const errors: IErrorReport[] = [];
      _Check_optional({
        ...project,
        errors,
      })({
        ...props,
        parameter: {
          name,
          symbol: props.symbol,
        },
      });
      if (generics.length !== 3)
        errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message: `@WebSocketRoute.Acceptor() must have three type arguments of WebAcceptor<Header, Provider, Listener>`,
        });
      const [header, provider, listener] = [
        "header",
        "provider",
        "listener",
      ].map((key, i) => {
        const tuple: ITypeTuple | null = ImportAnalyzer.analyze(
          project.checker,
        )({
          generics: props.generics,
          imports: props.imports,
          type: generics[i],
        });
        if (tuple === null)
          errors.push({
            file: props.controller.file,
            controller: props.controller.name,
            function: props.function,
            message: `unable to analyze the "${key}" argument type of WebAcceptor<Header, Provider, Listener>.`,
          });
        return tuple!;
      });

      if (errors.length) {
        project.errors.push(...errors);
        return null!;
      }
      return {
        ...props.parameter,
        category: "acceptor",
        name,
        header,
        provider,
        listener: listener,
      };
    };

  const _Analyze_driver =
    (project: INestiaProject) =>
    (props: {
      generics: GenericAnalyzer.Dictionary;
      imports: ImportAnalyzer.Dictionary;
      controller: IReflectController;
      function: string;
      parameter: IReflectWebSocketOperation.IParameter;
      symbol: ts.Symbol;
    }): ITypedWebSocketRoute.IDriverParameter => {
      // VALIDATIONS
      const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
        props.symbol,
        props.symbol.valueDeclaration!,
      );
      const name: string = props.symbol.getEscapedName().toString();
      const generics: readonly ts.Type[] =
        type.aliasTypeArguments ??
        project.checker.getTypeArguments(type as ts.TypeReference) ??
        [];

      const errors: IErrorReport[] = [];
      _Check_optional({
        ...project,
        errors,
      })({
        ...props,
        parameter: {
          name,
          symbol: props.symbol,
        },
      });
      const tuple: ITypeTuple = (() => {
        if (generics.length !== 1) {
          errors.push({
            file: props.controller.file,
            controller: props.controller.name,
            function: props.function,
            message: `@WebSocketRoute.Driver() must have one type argument of WebDriver<T>`,
          });
          return null!;
        } else {
          const tuple: ITypeTuple | null = ImportAnalyzer.analyze(
            project.checker,
          )({
            generics: props.generics,
            imports: props.imports,
            type: generics[0],
          });
          if (tuple === null)
            errors.push({
              file: props.controller.file,
              controller: props.controller.name,
              function: props.function,
              message: `unable to analyze the "type" argument of WebDriver<T>.`,
            });
          return tuple!;
        }
      })();
      if (errors.length) {
        project.errors.push(...errors);
        return null!;
      }
      return {
        ...props.parameter,
        category: "driver",
        name,
        type: tuple.type,
        typeName: tuple.typeName,
      };
    };

  const _Check_optional =
    (project: INestiaProject) =>
    (props: {
      controller: IReflectController;
      function: string;
      parameter: {
        name: string;
        symbol: ts.Symbol;
      };
    }) => {
      const optional: boolean = !!project.checker.symbolToParameterDeclaration(
        props.parameter.symbol,
        undefined,
        undefined,
      )?.questionToken;
      if (optional === true)
        project.errors.push({
          file: props.controller.file,
          controller: props.controller.name,
          function: props.function,
          message: `@WebSocketRoute() does not allow optional parameter, but be detected from ${JSON.stringify(
            props.parameter.symbol.getEscapedName().toString(),
          )}.`,
        });
    };
}

const wrapPaths = (paths: string[]): string[] =>
  paths.length === 0 ? [""] : paths;
