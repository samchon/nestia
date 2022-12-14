import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { NodeTransformer } from "./NodeTransformer";

export namespace FileTransformer {
    export function transform(
        project: INestiaTransformProject,
        context: ts.TransformationContext,
        file: ts.SourceFile,
    ): ts.SourceFile {
        // ITERATE NODES
        return ts.visitEachChild(
            file,
            (node) => iterate_node(project, context, node),
            context,
        );
    }

    function iterate_node(
        project: INestiaTransformProject,
        context: ts.TransformationContext,
        node: ts.Node,
    ): ts.Node {
        return ts.visitEachChild(
            try_transform_node(project, node),
            (child) => iterate_node(project, context, child),
            context,
        );
    }

    function try_transform_node(
        project: INestiaTransformProject,
        node: ts.Node,
    ): ts.Node {
        try {
            return NodeTransformer.transform(project, node);
        } catch (exp) {
            if (!(exp instanceof Error)) throw exp;

            const file: ts.SourceFile = node.getSourceFile();
            const { line, character } = file.getLineAndCharacterOfPosition(
                node.pos,
            );
            exp.message += ` - ${file.fileName}.${line + 1}:${character + 1}`;
            throw exp;
        }
    }
}
