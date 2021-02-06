import * as path from "path";
import * as ts from "typescript";

import { IController } from "../structures/IController";
import { IRoute } from "../structures/IRoute";

export namespace TypeAnalyzer
{
    export function analyze(controller: IController): IRoute[]
    {
        // PREPARE PROGRAM
        const program: ts.Program = ts.createProgram([ controller.file ], {});
        const checker: ts.TypeChecker = program.getTypeChecker();

        // LOAD SOURCE FILE
        const sourceFile: ts.SourceFile | undefined = program.getSourceFile(controller.file);
        if (sourceFile === undefined)
            return [];

        // FIND CONTROLLER CLASS
        const ret: IRoute[] = [];
        ts.forEachChild(sourceFile, node =>
        {
            if (ts.isClassDeclaration(node) && node.name?.escapedText === controller.name)
            {
                // ANALYZE THE CONTROLLER
                ret.push(..._Analyze_controller(checker, controller, node));
                return;
            }
        });
        return ret;
    }

    function _Analyze_controller(checker: ts.TypeChecker, controller: IController, classNode: ts.ClassDeclaration): IRoute[]
    {
        const ret: IRoute[] = [];

        const classType: ts.InterfaceType = checker.getTypeAtLocation(classNode) as ts.InterfaceType;
        for (const property of classType.getProperties())
            for (const declaration of property.declarations)
            {
                // TARGET ONLY METHOD
                if (!ts.isMethodDeclaration(declaration))
                    continue;
                
                // IT MUST BE
                const identifier = declaration.name;
                if (!ts.isIdentifier(identifier))
                    continue;
                
                // ANALYZED WITH THE REFLECTED-FUNCTION
                const func: IController.IFunction | undefined = controller.functions.find(f => f.name === identifier.escapedText);
                if (func !== undefined)
                    ret.push(_Analyze_function(checker, controller, func, declaration));
            }
        return ret;
    }

    function _Analyze_function(checker: ts.TypeChecker, controller: IController, func: IController.IFunction, declaration: ts.MethodDeclaration): IRoute
    {
        // PREPARE ASSETS
        const symbol: ts.Symbol = checker.getSymbolAtLocation(declaration.name)!;
        const type: ts.Type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
        const signature: ts.Signature = type.getCallSignatures()[0];

        // EXPLORE CHILDREN TYPES
        const parameters: IRoute.IParameter[] = func.parameters.map(param => _Analyze_parameter(checker, param, declaration.parameters[param.index]));
        const output: string = checker.typeToString(signature.getReturnType());

        // RETURNS
        return {
            ...func,
            path: path.join(controller.path, func.path),
            parameters,
            output
        };
    }

    function _Analyze_parameter(checker: ts.TypeChecker, param: IController.IParameter, declaration: ts.ParameterDeclaration): IRoute.IParameter
    {
        const symbol: ts.Symbol = checker.getSymbolAtLocation(declaration.name)!;
        const type: ts.Type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
        
        return {
            name: symbol.getEscapedName() as string,
            category: param.category,
            field: param.field,
            encrypted: param.encrypted,
            type: checker.typeToString(type)
        };
    }
}