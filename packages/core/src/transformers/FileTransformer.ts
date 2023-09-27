import ts from "typescript";

import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { NodeTransformer } from "./NodeTransformer";

export namespace FileTransformer {
    export const transform =
        (project: Omit<INestiaTransformProject, "context">) =>
        (context: ts.TransformationContext) =>
        (file: ts.SourceFile): ts.SourceFile =>
            file.isDeclarationFile
                ? file
                : ts.visitEachChild(
                      file,
                      (node) =>
                          iterate_node({
                              ...project,
                              context,
                          })(context)(file)(node),
                      context,
                  );

    const iterate_node =
        (project: INestiaTransformProject) =>
        (context: ts.TransformationContext) =>
        (file: ts.SourceFile) =>
        (node: ts.Node): ts.Node =>
            ts.visitEachChild(
                try_transform_node(project)(file)(node) ?? node,
                (child) => iterate_node(project)(context)(file)(child),
                context,
            );

    const try_transform_node =
        (project: INestiaTransformProject) =>
        (file: ts.SourceFile) =>
        (node: ts.Node): ts.Node | null => {
            try {
                return NodeTransformer.transform(project)(node);
            } catch (exp) {
                // ONLY ACCEPT TRANSFORMER-ERROR
                if (!isTransformerError(exp)) throw exp;

                // AVOID SPECIAL BUG OF TYPESCRIPT COMPILER API
                (node as any).parent ??= file;

                // REPORT DIAGNOSTIC
                const diagnostic = ts.createDiagnosticForNode(node, {
                    key: exp.code,
                    category: ts.DiagnosticCategory.Error,
                    message: exp.message,
                    code: `(${exp.code})` as any,
                });
                project.extras.addDiagnostic(diagnostic);
                return null;
            }
        };
}

const isTransformerError = (error: any): error is TransformerError =>
    typeof error === "object" &&
    error !== null &&
    error.constructor.name === "TransformerError" &&
    typeof error.code === "string" &&
    typeof error.message === "string";
