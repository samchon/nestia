import ts from "typescript";
import { ImportProgrammer } from "typia/lib/programmers/ImportProgrammer";
import { TransformerError } from "typia/lib/transformers/TransformerError";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { NodeTransformer } from "./NodeTransformer";

export namespace FileTransformer {
  export const transform =
    (context: Omit<INestiaTransformContext, "importer" | "transformer">) =>
    (transformer: ts.TransformationContext) =>
    (file: ts.SourceFile): ts.SourceFile => {
      if (file.isDeclarationFile) return file;
      const importer = new ImportProgrammer({
        internalPrefix: "nestia_core_transform",
      });
      file = ts.visitEachChild(
        file,
        (node) =>
          iterate_node({
            context: {
              ...context,
              transformer,
              importer,
            },
            file,
            node,
          }),
        transformer,
      );
      return ts.factory.updateSourceFile(
        file,
        [...importer.toStatements(), ...file.statements],
        false,
        file.referencedFiles,
        file.typeReferenceDirectives,
        file.hasNoDefaultLib,
        file.libReferenceDirectives,
      );
    };

  const iterate_node = (props: {
    context: INestiaTransformContext;
    file: ts.SourceFile;
    node: ts.Node;
  }): ts.Node =>
    ts.visitEachChild(
      try_transform_node(props) ?? props.node,
      (child) =>
        iterate_node({
          context: props.context,
          file: props.file,
          node: child,
        }),
      props.context.transformer,
    );

  const try_transform_node = (props: {
    context: INestiaTransformContext;
    file: ts.SourceFile;
    node: ts.Node;
  }): ts.Node | null => {
    try {
      return NodeTransformer.transform(props);
    } catch (exp) {
      // ONLY ACCEPT TRANSFORMER-ERROR
      if (!isTransformerError(exp)) throw exp;

      // AVOID SPECIAL BUG OF TYPESCRIPT COMPILER API
      (props.node as any).parent ??= props.file;

      // REPORT DIAGNOSTIC
      const diagnostic = (ts as any).createDiagnosticForNode(props.node, {
        key: exp.code,
        category: ts.DiagnosticCategory.Error,
        message: exp.message,
        code: `(${exp.code})` as any,
      });
      props.context.extras.addDiagnostic(diagnostic);
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
