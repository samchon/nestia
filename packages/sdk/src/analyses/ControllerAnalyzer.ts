import path from "path";
import { HashMap } from "tstl/container/HashMap";
import ts from "typescript";

import { CommentFactory } from "typia/lib/factories/CommentFactory";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";
import { ITypeTuple } from "../structures/ITypeTuple";
import { PathUtil } from "../utils/PathUtil";
import { ExceptionAnalyzer } from "./ExceptionAnalyzer";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";
import { SecurityAnalyzer } from "./SecurityAnalyzer";

export namespace ControllerAnalyzer {
    export function analyze(
        checker: ts.TypeChecker,
        sourceFile: ts.SourceFile,
        controller: IController,
    ): IRoute[] {
        // FIND CONTROLLER CLASS
        const ret: IRoute[] = [];
        ts.forEachChild(sourceFile, (node) => {
            if (
                ts.isClassDeclaration(node) &&
                node.name?.escapedText === controller.name
            ) {
                // ANALYZE THE CONTROLLER
                ret.push(..._Analyze_controller(checker, controller, node));
                return;
            }
        });
        return ret;
    }

    /* ---------------------------------------------------------
        CLASS
    --------------------------------------------------------- */
    function _Analyze_controller(
        checker: ts.TypeChecker,
        controller: IController,
        classNode: ts.ClassDeclaration,
    ): IRoute[] {
        const classType: ts.InterfaceType = checker.getTypeAtLocation(
            classNode,
        ) as ts.InterfaceType;
        const genericDict: GenericAnalyzer.Dictionary = GenericAnalyzer.analyze(
            checker,
            classNode,
        );

        const ret: IRoute[] = [];
        for (const property of classType.getProperties()) {
            // GET METHOD DECLARATION
            const declaration: ts.Declaration | undefined =
                (property.declarations || [])[0];
            if (!declaration || !ts.isMethodDeclaration(declaration)) continue;

            // IDENTIFIER MUST BE
            const identifier = declaration.name;
            if (!ts.isIdentifier(identifier)) continue;

            // ANALYZED WITH THE REFLECTED-FUNCTION
            const runtime: IController.IFunction | undefined =
                controller.functions.find(
                    (f) => f.name === identifier.escapedText,
                );
            if (runtime === undefined) continue;

            const routes: IRoute[] = _Analyze_function(
                checker,
                controller,
                genericDict,
                runtime,
                declaration,
                property,
            );
            ret.push(...routes);
        }
        return ret;
    }

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    function _Analyze_function(
        checker: ts.TypeChecker,
        controller: IController,
        genericDict: GenericAnalyzer.Dictionary,
        func: IController.IFunction,
        declaration: ts.MethodDeclaration,
        symbol: ts.Symbol,
    ): IRoute[] {
        // PREPARE ASSETS
        const type: ts.Type = checker.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration!,
        );
        const signature: ts.Signature | undefined = checker.getSignaturesOfType(
            type,
            ts.SignatureKind.Call,
        )[0];
        if (signature === undefined)
            throw new Error(
                `Error on ControllerAnalyzer.analyze(): unable to get the signature from the ${controller.name}.${func.name}().`,
            );

        const importDict: ImportAnalyzer.Dictionary = new HashMap();

        // EXPLORE CHILDREN TYPES
        const parameters: IRoute.IParameter[] = func.parameters.map((param) =>
            _Analyze_parameter(
                checker,
                genericDict,
                importDict,
                controller,
                func.name,
                param,
                signature.getParameters()[param.index],
            ),
        );
        const outputType: ITypeTuple | null = ImportAnalyzer.analyze(
            checker,
            genericDict,
            importDict,
            signature.getReturnType(),
        );
        if (outputType === null)
            throw new Error(
                `Error on ControllerAnalyzer.analyze(): unnamed return type from ${controller.name}.${func.name}().`,
            );
        else if (
            func.method === "HEAD" &&
            outputType.name !== "void" &&
            outputType.name !== "undefined"
        )
            throw new Error(
                `Error on ControllerAnalyzer.analyze(): HEAD method must return void type - ${controller.name}.${func.name}().`,
            );

        const imports: [string, string[]][] = importDict
            .toJSON()
            .map((pair) => [pair.first, pair.second.toJSON()]);

        // PARSE COMMENT TAGS
        const tags = signature.getJsDocTags();
        const security: Record<string, string[]>[] = SecurityAnalyzer.merge(
            ...controller.security,
            ...func.security,
            ...tags
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
            parameters,
            output: { ...outputType, contentType: func.contentType },
            imports,
            status: func.status,

            symbol: `${controller.name}.${func.name}()`,
            location: (() => {
                const file = declaration.getSourceFile();
                const { line, character } = file.getLineAndCharacterOfPosition(
                    declaration.pos,
                );
                return `${path.relative(process.cwd(), file.fileName)}:${
                    line + 1
                }:${character + 1}`;
            })(),
            description: CommentFactory.description(symbol),
            tags,
            setHeaders: tags
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
            exceptions: ExceptionAnalyzer.analyze(checker)(
                genericDict,
                importDict,
            )(func)(declaration),
        };

        // CONFIGURE PATHS
        const pathList: string[] = [];
        for (const controllerPath of controller.paths)
            for (const filePath of func.paths) {
                const path: string = PathAnalyzer.join(
                    controllerPath,
                    filePath,
                );
                pathList.push(
                    PathAnalyzer.espace(
                        path,
                        () => "ControllerAnalyzer.analyze()",
                    ),
                );
            }

        // RETURNS
        return pathList.map((path) => ({
            ...common,
            path,
            accessors: [...PathUtil.accessors(path), func.name],
        }));
    }

    function _Analyze_parameter(
        checker: ts.TypeChecker,
        genericDict: GenericAnalyzer.Dictionary,
        importDict: ImportAnalyzer.Dictionary,
        controller: IController,
        funcName: string,
        param: IController.IParameter,
        symbol: ts.Symbol,
    ): IRoute.IParameter {
        const type: ts.Type = checker.getTypeOfSymbolAtLocation(
            symbol,
            symbol.valueDeclaration!,
        );
        const name: string = symbol.getEscapedName().toString();
        const method: string = `${controller.name}.${funcName}()`;

        const optional: boolean = !!checker.symbolToParameterDeclaration(
            symbol,
            undefined,
            undefined,
        )?.questionToken;

        // DO NOT SUPPORT BODY PARAMETER
        if (param.category === "body" && param.field !== undefined)
            throw new Error(
                `Error on ${method}: nestia does not support body field specification. ` +
                    `Therefore, erase the ${method}#${name} parameter and ` +
                    `re-define a new body decorator accepting full structured message.`,
            );
        else if (optional === true && param.category !== "query")
            throw new Error(
                `Error on ${method}: nestia does not support optional parameter except query parameter. ` +
                    `Therefore, erase question mark on ${method}#${name} parameter, ` +
                    `or re-define a new method without the "name" parameter.`,
            );
        else if (
            optional === true &&
            param.category === "query" &&
            param.field === undefined
        )
            throw new Error(
                `Error on ${method}: nestia does not support optional query parameter without field specification. ` +
                    `Therefore, erase question mark on ${method}#${name} parameter, ` +
                    `or re-define re-define parameters for each query parameters.`,
            );

        // GET TYPE NAME
        const tuple: ITypeTuple | null = ImportAnalyzer.analyze(
            checker,
            genericDict,
            importDict,
            type,
        );
        if (tuple === null)
            throw new Error(
                `Error on ${method}: unnamed parameter type from ${method}#${name}.`,
            );
        return {
            ...param,
            name,
            optional,
            type: tuple,
        };
    }
}
