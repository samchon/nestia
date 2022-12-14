import ts from "typescript";

import { INestiaTransformProject } from "../options/INestiaTransformProject";
import { BodyTransformer } from "./BodyTransformer";

export namespace ParameterTransformer {
    export function transform(
        project: INestiaTransformProject,
        param: ts.ParameterDeclaration,
    ): ts.ParameterDeclaration {
        const decorators: readonly ts.Decorator[] | undefined = ts.getDecorators
            ? ts.getDecorators(param)
            : (param as any).decorators;
        if (!decorators?.length) return param;

        const type: ts.Type = project.checker.getTypeAtLocation(param);
        if (ts.getDecorators !== undefined)
            return ts.factory.updateParameterDeclaration(
                param,
                (param.modifiers || []).map((mod) =>
                    ts.isDecorator(mod)
                        ? BodyTransformer.transform(project, type, mod)
                        : mod,
                ),
                param.dotDotDotToken,
                param.name,
                param.questionToken,
                param.type,
                param.initializer,
            );
        // eslint-disable-next-line
        return ts.factory.updateParameterDeclaration(
            param,
            decorators.map((deco) =>
                BodyTransformer.transform(project, type, deco),
            ),
            (param as any).modifiers,
            param.dotDotDotToken,
            param.name,
            param.questionToken,
            param.type,
            param.initializer,
        );
    }
}
