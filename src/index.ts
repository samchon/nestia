import * as ts from "typescript";
import * as path from "path";

function main(): void
{
    const fileNames: string[] = [
        "IClass", 
        "IMethod", 
        "IParameter", 
        "IVariable"
    ].map(str => path.normalize(`${__dirname}/../src/structures/${str}.ts`));

    const program: ts.Program = ts.createProgram(fileNames, {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS
    });

    const sourceFiles: readonly ts.SourceFile[] = program.getSourceFiles();
    for (const source of sourceFiles)
    {
        const sourcePath: string = path.normalize(source.fileName);
        if (fileNames.find(str => str === sourcePath) === undefined)
            continue;

        console.log("----------------------------------");
        console.log(sourcePath);
        console.log("----------------------------------");
        ts.forEachChild(source, node =>
        {
            if (ts.isClassDeclaration(node))
            {

            }
            else if (ts.isInterfaceDeclaration(node))
            {
                node.decorators
            }
        });
    }
}
main();