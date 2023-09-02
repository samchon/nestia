import ts from "typescript";

import { IProject } from "typia/lib/transformers/IProject";

import { INestiaTransformOptions } from "./options/INestiaTransformOptions";
import { FileTransformer } from "./transformers/FileTransformer";

export const transform = (
    program: ts.Program,
    options: INestiaTransformOptions | undefined,
    extras: IProject["extras"],
): ts.TransformerFactory<ts.SourceFile> => {
    const compilerOptions: ts.CompilerOptions = program.getCompilerOptions();
    const strict: boolean =
        compilerOptions.strictNullChecks !== undefined
            ? !!compilerOptions.strictNullChecks
            : !!compilerOptions.strict;
    if (strict === false)
        extras.addDiagnostic({
            category: ts.DiagnosticCategory.Error,
            code: "(@nestia/core)" as any,
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: "strict mode is required.",
        });
    return FileTransformer.transform({
        program,
        compilerOptions,
        checker: program.getTypeChecker(),
        printer: ts.createPrinter(),
        options: options ?? {},
        extras,
    });
};
export default transform;
