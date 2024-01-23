import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { MethodTransformer } from "./MethodTransformer";
import { ParameterTransformer } from "./ParameterTransformer";

export namespace NodeTransformer {
  export const transform =
    (project: INestiaTransformProject) =>
    (node: ts.Node): ts.Node =>
      ts.isMethodDeclaration(node)
        ? MethodTransformer.transform(project)(node)
        : ts.isParameter(node)
          ? ParameterTransformer.transform(project)(node)
          : node;
}
