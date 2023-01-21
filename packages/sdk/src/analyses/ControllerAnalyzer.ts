import { HashMap } from "tstl/container/HashMap";
import ts from "typescript";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";
import { ITypeTuple } from "../structures/ITypeTuple";
import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";
import { PathAnalyzer } from "./PathAnalyzer";

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
        const output: ITypeTuple = ImportAnalyzer.analyze(
            checker,
            genericDict,
            importDict,
            signature.getReturnType(),
        );
        const imports: [string, string[]][] = importDict
            .toJSON()
            .map((pair) => [pair.first, pair.second.toJSON()]);

        // CONSTRUCT COMMON DATA
        const tags = signature.getJsDocTags();
        const common: Omit<IRoute, "path"> = {
            ...func,
            parameters,
            output,
            imports,

            symbol: `${controller.name}.${func.name}()`,
            comments: signature.getDocumentationComment(undefined),
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
        }));
    }

    /* ---------------------------------------------------------
        PARAMETER
    --------------------------------------------------------- */
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

        // DO NOT SUPPORT BODY PARAMETER
        if (param.category === "body" && param.field !== undefined) {
            const method: string = `${controller.name}.${funcName}()`;
            throw new Error(
                `Error on ${method}: nestia does not support body field specification. ` +
                    `Therefore, erase the ${method}#${name} parameter and ` +
                    `re-define a new body decorator accepting full structured message.`,
            );
        }

        return {
            name,
            category: param.category,
            field: param.field,
            encrypted: param.encrypted,
            type: ImportAnalyzer.analyze(
                checker,
                genericDict,
                importDict,
                type,
            ),
        };
    }
}
