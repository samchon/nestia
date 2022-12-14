import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { MethodTransformer } from "./MethodTransformer";
import { ParameterTransformer } from "./ParameterTransformer";

export namespace NodeTransformer {
    export function transform(
        project: INestiaTransformProject,
        node: ts.Node,
    ): ts.Node {
        if (ts.isMethodDeclaration(node))
            return MethodTransformer.transform(project, node);
        else if (ts.isParameter(node))
            return ParameterTransformer.transform(project, node);
        return node;
    }
}
