import ts from "typescript";

import { INestiaTransformOptions } from "./options/INestiaTransformOptions";
import { FileTransformer } from "./transformers/FileTransformer";

export const transform = (
    program: ts.Program,
    options?: INestiaTransformOptions,
): ts.TransformerFactory<ts.SourceFile> =>
    FileTransformer.transform({
        program,
        compilerOptions: program.getCompilerOptions(),
        checker: program.getTypeChecker(),
        printer: ts.createPrinter(),
        options: options || {},
    });
export default transform;
