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

    function _Analyze_controller(checker: ts.TypeChecker, controller: IController, node: ts.ClassDeclaration): IRoute[]
    {
        const ret: IRoute[] = [];

        for (const child of node.members)
            if (ts.isMethodDeclaration(child) && ts.isIdentifier(child.name))
            {
                // FIND TARGET FUNCTION
                const name: string = (child.name as ts.Identifier).escapedText as string;
                const func: IController.IFunction | undefined = controller.functions.find(f => f.name === name);

                // CONSTRUCT THE ROUTE INFO
                if (func !== undefined)
                    ret.push(_Analyze_function(checker, controller, func, child));
            }
        return ret;
    }

    function _Analyze_function(checker: ts.TypeChecker, controller: IController, func: IController.IFunction, node: ts.MethodDeclaration): IRoute
    {
        const route: IRoute = {
            name: func.name,
            method: func.method,
            path: path.join(controller.path, func.path),
            encrypted: func.encrypted,
            type: "unknown",
            parameters: []
        };
        for (const param of func.parameters)
            route.parameters.push(_Analyze_parameter(checker, param, node.parameters[param.index]));
        return route;
    }

    function _Analyze_parameter(checker: ts.TypeChecker, param: IController.IParameter, node: ts.ParameterDeclaration): IRoute.IParameter
    {
        const symbol: ts.Symbol = checker.getSymbolAtLocation(node.name)!;
        const type: ts.Type = checker.getTypeOfSymbolAtLocation(symbol, node);
        
        return {
            name: symbol.getEscapedName() as string,
            category: param.category,
            field: param.field,
            encrypted: param.encrypted,
            type: checker.typeToString(type)
        };
    }
}