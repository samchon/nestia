// import * as ts from "typescript";

// export namespace InterfaceAnalyzer
// {
//     export function analyze(checker: ts.TypeChecker, type: ts.Type, level: number = 0)
//     {
//         for (const property of type.getProperties())
//             for (const declaration of property.declarations)
//                 if (ts.isPropertySignature(declaration))
//                     analyze_property(checker, declaration, level);
//     }

//     function analyze_property(checker: ts.TypeChecker, declaration: ts.PropertySignature, level: number)
//     {
//         const typeNode: ts.TypeNode | undefined = declaration.type;
//         if (typeNode === undefined)
//             return;

//         console.log("\t".repeat(level) + declaration.getText());

//         const type: ts.Type = checker.getTypeAtLocation(typeNode);
//         analyze(checker, type, level + 1);
//     }
// }