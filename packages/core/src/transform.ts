import ts from "typescript";

import { INestiaTransformOptions } from "./options/INestiaTransformOptions";
import { INestiaTransformProject } from "./options/INestiaTransformProject";
import { FileTransformer } from "./transformers/FileTransformer";

export default function transform(
    program: ts.Program,
    options?: INestiaTransformOptions,
): ts.TransformerFactory<ts.SourceFile> {
    const project: INestiaTransformProject = {
        program,
        compilerOptions: program.getCompilerOptions(),
        checker: program.getTypeChecker(),
        printer: ts.createPrinter(),
        options: options || {},
    };
    return (context) => (file) =>
        FileTransformer.transform(project, context, file);
}
