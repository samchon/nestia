import NodePath from "path";
import ts from "typescript";
import { HashMap } from "tstl/container/HashMap";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";
import { IType } from "../structures/IType";

import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";

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
                `Error on ControllerAnalyzer._Analyze_function(): unable to get the signature from the ${controller.name}.${func.name}().`,
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
        const output: IType = ImportAnalyzer.analyze(
            checker,
            genericDict,
            importDict,
            signature.getReturnType(),
        );
        const imports: [string, string[]][] = importDict
            .toJSON()
            .map((pair) => [pair.first, pair.second.toJSON()]);

        // CONSTRUCT COMMON DATA
        const common: Omit<IRoute, "path"> = {
            ...func,
            parameters,
            output,
            imports,

            symbol: `${controller.name}.${func.name}()`,
            comments: signature.getDocumentationComment(undefined),
            tags: signature.getJsDocTags(),
        };

        // CONFIGURE PATHS
        const pathList: string[] = [];
        for (const controllerPath of controller.paths)
            for (const filePath of func.paths) {
                const path: string = NodePath.join(controllerPath, filePath)
                    .split("\\")
                    .join("/");
                pathList.push(_Normalize_path(path));
            }

        // RETURNS
        return pathList.map((path) => ({
            ...common,
            path,
        }));
    }

    function _Normalize_path(path: string) {
        if (path[0] !== "/") path = "/" + path;
        if (path[path.length - 1] === "/" && path !== "/")
            path = path.substr(0, path.length - 1);
        return path;
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

        // VALIDATE PARAMETERS
        if (
            (param.category === "query" || param.category === "body") &&
            param.field !== undefined
        )
            throw new Error(
                `Error on ${controller.name}.${funcName}(): parameter ${name} is specifying a field ${param.field} of the request ${param.category} message, however, Nestia does not support the field specialization for the request ${param.category} message. Erase the ${controller.name}.${funcName}()#${name} parameter and re-define a new decorator accepting full structured message.`,
            );

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
