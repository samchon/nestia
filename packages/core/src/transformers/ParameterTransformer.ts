import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { ParameterDecoratorTransformer } from "./ParameterDecoratorTransformer";

export namespace ParameterTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    param: ts.ParameterDeclaration;
  }): ts.ParameterDeclaration => {
    // CHECK DECORATOR
    const decorators: readonly ts.Decorator[] | undefined = ts.getDecorators
      ? ts.getDecorators(props.param)
      : (props.param as any).decorators;
    if (!decorators?.length) return props.param;

    // GET TYPE INFO
    const type: ts.Type = props.context.checker.getTypeAtLocation(props.param);

    // WHEN LATEST TS VERSION
    if (ts.getDecorators !== undefined)
      return ts.factory.updateParameterDeclaration(
        props.param,
        (props.param.modifiers || []).map((mod) =>
          ts.isDecorator(mod)
            ? ParameterDecoratorTransformer.transform({
                context: props.context,
                decorator: mod,
                type,
              })
            : mod,
        ),
        props.param.dotDotDotToken,
        props.param.name,
        props.param.questionToken,
        props.param.type,
        props.param.initializer,
      );
    // eslint-disable-next-line
    return (ts.factory.updateParameterDeclaration as any)(
      props.param,
      decorators.map((deco) =>
        ParameterDecoratorTransformer.transform({
          context: props.context,
          decorator: deco,
          type,
        }),
      ),
      (props.param as any).modifiers,
      props.param.dotDotDotToken,
      props.param.name,
      props.param.questionToken,
      props.param.type,
      props.param.initializer,
    );
  };
}
