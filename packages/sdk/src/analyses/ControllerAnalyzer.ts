import { VERSION_NEUTRAL, VersionValue } from "@nestjs/common/interfaces";
import path from "path";
import { HashMap } from "tstl/container/HashMap";
import ts from "typescript";

import { CommentFactory } from "typia/lib/factories/CommentFactory";

import { IController } from "../structures/IController";
import { IErrorReport } from "../structures/IErrorReport";
import { INestiaProject } from "../structures/INestiaProject";
import { IRoute } from "../structures/IRoute";
import { ITypeTuple } from "../structures/ITypeTuple";
import { PathUtil } from "../utils/PathUtil";
import { ExceptionAnalyzer } from "./ExceptionAnalyzer";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { SecurityAnalyzer } from "./SecurityAnalyzer";

export namespace ControllerAnalyzer {
    export const analyze =
        (project: INestiaProject) =>
        async (
            sourceFile: ts.SourceFile,
            controller: IController,
        ): Promise<IRoute[]> => {
            // FIND CONTROLLER CLASS
            const ret: IRoute[] = [];
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
        (controller: IController, classNode: ts.ClassDeclaration): IRoute[] => {
            const classType: ts.InterfaceType =
                project.checker.getTypeAtLocation(
                    classNode,
                ) as ts.InterfaceType;
            const genericDict: GenericAnalyzer.Dictionary =
                GenericAnalyzer.analyze(project.checker, classNode);

            const ret: IRoute[] = [];
            for (const property of classType.getProperties()) {
                // GET METHOD DECLARATION
                const declaration: ts.Declaration | undefined =
                    (property.declarations || [])[0];
                if (!declaration || !ts.isMethodDeclaration(declaration))
                    continue;

                // IDENTIFIER MUST BE
                const identifier = declaration.name;
                if (!ts.isIdentifier(identifier)) continue;

                // ANALYZED WITH THE REFLECTED-FUNCTION
                const runtime: IController.IFunction | undefined =
                    controller.functions.find(
                        (f) => f.name === identifier.escapedText,
                    );
                if (runtime === undefined) continue;

                const routes: IRoute[] = _Analyze_function(project)(
                    controller,
                    genericDict,
                    runtime,
                    declaration,
                    property,
                );
                ret.push(...routes);
            }
            return ret;
        };

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    const _Analyze_function =
        (project: INestiaProject) =>
        (
            controller: IController,
            genericDict: GenericAnalyzer.Dictionary,
            func: IController.IFunction,
            declaration: ts.MethodDeclaration,
            symbol: ts.Symbol,
        ): IRoute[] => {
            // PREPARE ASSETS
            const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
                symbol,
                symbol.valueDeclaration!,
            );
            const signature: ts.Signature | undefined =
                project.checker.getSignaturesOfType(
                    type,
                    ts.SignatureKind.Call,
                )[0];
            if (signature === undefined) {
                project.errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: func.name,
                    message: "unable to get the type signature.",
                });
                return [];
            }

            // EXPLORE CHILDREN TYPES
            const importDict: ImportAnalyzer.Dictionary = new HashMap();
            const parameters: Array<IRoute.IParameter | null> =
                func.parameters.map(
                    (param) =>
                        _Analyze_parameter(project)(
                            genericDict,
                            importDict,
                            controller,
                            func.name,
                            param,
                            signature.getParameters()[param.index],
                        )!,
                );
            const outputType: ITypeTuple | null = ImportAnalyzer.analyze(
                project.checker,
                genericDict,
                importDict,
                signature.getReturnType(),
            );
            if (outputType === null || outputType.typeName === "__type") {
                project.errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: func.name,
                    message: "implicit (unnamed) return type.",
                });
                return [];
            } else if (
                func.method === "HEAD" &&
                outputType.typeName !== "void" &&
                outputType.typeName !== "undefined"
            ) {
                project.errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: func.name,
                    message: `HEAD method must return void type.`,
                });
                return [];
            }

            const exceptions = ExceptionAnalyzer.analyze(project)(
                genericDict,
                project.config.propagate === true ? importDict : new HashMap(),
            )(
                controller,
                func,
            )(declaration);
            const imports: [string, string[]][] = importDict
                .toJSON()
                .map((pair) => [pair.first, pair.second.toJSON()]);

            // PARSE COMMENT TAGS
            const jsDocTags = signature.getJsDocTags();
            const security: Record<string, string[]>[] = SecurityAnalyzer.merge(
                ...controller.security,
                ...func.security,
                ...jsDocTags
                    .filter((tag) => tag.name === "security")
                    .map((tag) =>
                        (tag.text ?? []).map((text) => {
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
            const common: Omit<IRoute, "path" | "accessors"> = {
                ...func,
                parameters: parameters.filter(
                    (p) => p !== null,
                ) as IRoute.IParameter[],
                output: {
                    type: outputType.type,
                    typeName: outputType.typeName,
                    contentType: func.contentType,
                },
                imports,
                status: func.status,
                symbol: {
                    class: controller.name,
                    function: func.name,
                },
                location: (() => {
                    const file = declaration.getSourceFile();
                    const { line, character } =
                        file.getLineAndCharacterOfPosition(declaration.pos);
                    return `${path.relative(process.cwd(), file.fileName)}:${
                        line + 1
                    }:${character + 1}`;
                })(),
                description: CommentFactory.description(symbol),
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
                            (t.name === "setHeader" ||
                                t.name === "assignHeaders"),
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
            const versions: Array<string | null> = _Analyze_versions(
                project.input.versioning === undefined
                    ? undefined
                    : func.versions ??
                          controller.versions ??
                          (project.input.versioning?.defaultVersion !==
                          undefined
                              ? Array.isArray(
                                    project.input.versioning?.defaultVersion,
                                )
                                  ? project.input.versioning?.defaultVersion
                                  : [project.input.versioning?.defaultVersion]
                              : undefined) ??
                          undefined,
            );
            for (const prefix of controller.prefixes)
                for (const cPath of controller.paths)
                    for (const filePath of func.paths)
                        pathList.add(
                            PathAnalyzer.join(prefix, cPath, filePath),
                        );

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
                        method: func.method,
                        path: individual,
                    }),
                )
                .flat()
                .map((path) => ({
                    ...common,
                    path: PathAnalyzer.escape(
                        path,
                        () => "ControllerAnalyzer.analyze()",
                    ),
                    accessors: [...PathUtil.accessors(path), func.name],
                }));
        };

    const _Analyze_parameter =
        (project: INestiaProject) =>
        (
            genericDict: GenericAnalyzer.Dictionary,
            importDict: ImportAnalyzer.Dictionary,
            controller: IController,
            funcName: string,
            param: IController.IParameter,
            symbol: ts.Symbol,
        ): IRoute.IParameter | null => {
            const type: ts.Type = project.checker.getTypeOfSymbolAtLocation(
                symbol,
                symbol.valueDeclaration!,
            );
            const name: string = symbol.getEscapedName().toString();

            const optional: boolean =
                !!project.checker.symbolToParameterDeclaration(
                    symbol,
                    undefined,
                    undefined,
                )?.questionToken;

            const errors: IErrorReport[] = [];

            // DO NOT SUPPORT BODY PARAMETER
            if (param.category === "body" && param.field !== undefined)
                errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: funcName,
                    message:
                        `nestia does not support body field specification. ` +
                        `Therefore, erase the "${name}" parameter and ` +
                        `re-define a new body decorator accepting full structured message.`,
                });
            if (optional === true && param.category !== "query")
                errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: funcName,
                    message:
                        `nestia does not support optional parameter except query parameter. ` +
                        `Therefore, erase question mark on the "${name}" parameter, ` +
                        `or re-define a new method without the "${name}" parameter.`,
                });
            if (
                optional === true &&
                param.category === "query" &&
                param.field === undefined
            )
                errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: funcName,
                    message:
                        `nestia does not support optional query parameter without field specification. ` +
                        `Therefore, erase question mark on the "${name}" parameter, ` +
                        `or re-define re-define parameters for each query parameters.`,
                });

            // GET TYPE NAME
            const tuple: ITypeTuple | null = ImportAnalyzer.analyze(
                project.checker,
                genericDict,
                importDict,
                type,
            );
            if (tuple === null || tuple.typeName === "__type")
                errors.push({
                    file: controller.file,
                    controller: controller.name,
                    function: funcName,
                    message: `implicit (unnamed) parameter type from "${name}".`,
                });
            if (errors.length) {
                project.errors.push(...errors);
                return null;
            }
            return {
                ...param,
                name,
                optional,
                type: tuple!.type,
                typeName: tuple!.typeName,
            };
        };

    function _Analyze_versions(
        value:
            | Array<
                  Exclude<VersionValue, Array<string | typeof VERSION_NEUTRAL>>
              >
            | undefined,
    ): Array<string | null> {
        if (value === undefined) return [null];
        return value.map((v) => (typeof v === "symbol" ? null : v));
    }
}
