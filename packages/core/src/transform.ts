import ts from "typescript";
import { IProject } from "typia/lib/transformers/IProject";
import { INestiaTransformOptions } from "./options/INestiaTransformOptions";

import { FileTransformer } from "./transformers/FileTransformer";

export default function transform(
    program: ts.Program,
    options?: INestiaTransformOptions,
): ts.TransformerFactory<ts.SourceFile> {
    const project: IProject = {
        program,
        compilerOptions: program.getCompilerOptions(),
        checker: program.getTypeChecker(),
        printer: ts.createPrinter(),
        options: options || {},
    };
    return (context) => (file) =>
        FileTransformer.transform(project, context, file);
}
