import * as NodePath from "path";
import * as tsc from "typescript";
import { HashMap } from "tstl/container/HashMap";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";

import { GenericAnalyzer } from "./GenericAnalyzer";
import { ImportAnalyzer } from "./ImportAnalyzer";

export namespace ControllerAnalyzer
{
    export function analyze(checker: tsc.TypeChecker, sourceFile: tsc.SourceFile, controller: IController): IRoute[]
    {
        // FIND CONTROLLER CLASS
        const ret: IRoute[] = [];
        tsc.forEachChild(sourceFile, node =>
        {
            if (tsc.isClassDeclaration(node) && node.name?.escapedText === controller.name)
            {
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
    function _Analyze_controller
        (
            checker: tsc.TypeChecker, 
            controller: IController, 
            classNode: tsc.ClassDeclaration
        ): IRoute[]
    {
        const ret: IRoute[] = [];
        const classType: tsc.InterfaceType = checker.getTypeAtLocation(classNode) as tsc.InterfaceType;
        const genericDict: GenericAnalyzer.Dictionary = GenericAnalyzer.analyze(checker, classNode);

        for (const property of classType.getProperties())
            if (property.declarations)
                for (const declaration of property.declarations)
                {
                    // TARGET ONLY METHOD
                    if (!tsc.isMethodDeclaration(declaration))
                        continue;
                    
                    // IT MUST BE
                    const identifier = declaration.name;
                    if (!tsc.isIdentifier(identifier))
                        continue;
                
                    // ANALYZED WITH THE REFLECTED-FUNCTION
                    const func: IController.IFunction | undefined = controller.functions.find(f => f.name === identifier.escapedText);
                    if (func !== undefined)
                        ret.push(_Analyze_function(checker, controller, genericDict, func, declaration));
                }
        return ret;
    }

    /* ---------------------------------------------------------
        FUNCTION
    --------------------------------------------------------- */
    function _Analyze_function
        (
            checker: tsc.TypeChecker, 
            controller: IController, 
            genericDict: GenericAnalyzer.Dictionary,
            func: IController.IFunction, 
            declaration: tsc.MethodDeclaration
        ): IRoute
    {
        // PREPARE ASSETS
        const signature: tsc.Signature | undefined = checker.getSignatureFromDeclaration(declaration);
        if (signature === undefined)
            throw new Error(`Error on ControllerAnalyzer._Analyze_function(): unable to get the ignature from the ${controller.name}.${func.name}().`);
        
        const importDict: ImportAnalyzer.Dictionary = new HashMap();

        // EXPLORE CHILDREN TYPES
        const parameters: IRoute.IParameter[] = func.parameters.map(param => _Analyze_parameter
        (
            checker, 
            genericDict, 
            importDict, 
            controller,
            func.name,
            param, 
            declaration.parameters[param.index]
        ));
        const output: string = ImportAnalyzer.analyze
        (
            checker,
            genericDict,
            importDict,
            checker.getReturnTypeOfSignature(signature),
        );
        const imports: [string, string[]][] = importDict.toJSON().map(pair => [pair.first, pair.second.toJSON()]);

        // CONFIGURE PATH
        const path: string = _Normalize_path
        (
            NodePath.join(controller.path, func.path)
                .split("\\")
                .join("/")
        );

        // RETURNS
        return {
            ...func,
            path,
            parameters,
            output,
            imports,

            symbol: `${controller.name}.${func.name}()`,
            comments: signature.getDocumentationComment(undefined),
            tags: signature.getJsDocTags()
        };
    }

    function _Normalize_path(path: string)
    {
        if (path[0] !== "/")
            path = "/" + path;
        if (path[path.length - 1] === "/" && path !== "/")
            path = path.substr(0, path.length - 1);
        return path;
    }

    /* ---------------------------------------------------------
        PARAMETER
    --------------------------------------------------------- */
    function _Analyze_parameter
        (
            checker: tsc.TypeChecker, 
            genericDict: GenericAnalyzer.Dictionary,
            importDict: ImportAnalyzer.Dictionary,
            controller: IController,
            funcName: string,
            param: IController.IParameter, 
            declaration: tsc.ParameterDeclaration
        ): IRoute.IParameter
    {
        const symbol: tsc.Symbol = checker.getSymbolAtLocation(declaration.name)!;
        const type: tsc.Type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
        const name: string = symbol.getEscapedName().toString();

        // VALIDATE PARAMETERS
        if ((param.category === "query" || param.category === "body") && param.field !== undefined)
            throw new Error(`Error on ${controller.name}.${funcName}(): parameter ${name} is specifying a field ${param.field} of the request ${param.category} message, however, Nestia does not support the field specialization for the request ${param.category} message. Erase the ${controller.name}.${funcName}()#${name} parameter and re-define a new decorator accepting full structured message.`);

        return {
            name,
            category: param.category,
            field: param.field,
            encrypted: param.encrypted,
            type: ImportAnalyzer.analyze(checker, genericDict, importDict, type)
        };
    }
}