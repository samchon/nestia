import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { TypedRouteTransformer } from "./TypedRouteTransformer";
import { WebSocketRouteTransformer } from "./WebSocketRouteTransformer";

export namespace MethodTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    method: ts.MethodDeclaration;
  }): ts.MethodDeclaration => {
    const decorators: readonly ts.Decorator[] | undefined = ts.getDecorators
      ? ts.getDecorators(props.method)
      : (props.method as any).decorators;
    if (!decorators?.length) return props.method;

    const signature: ts.Signature | undefined =
      props.context.checker.getSignatureFromDeclaration(props.method);
    const original: ts.Type | undefined =
      signature && props.context.checker.getReturnTypeOfSignature(signature);
    const type: ts.Type | undefined =
      original && get_escaped_type(props.context.checker)(original);

    if (type === undefined) return props.method;

    const operator = (decorator: ts.Decorator): ts.Decorator => {
      decorator = TypedRouteTransformer.transform({
        context: props.context,
        decorator,
        type,
      });
      decorator = WebSocketRouteTransformer.validate({
        context: props.context,
        method: props.method,
        decorator,
      });
      return decorator;
    };
    if (ts.getDecorators !== undefined)
      return ts.factory.updateMethodDeclaration(
        props.method,
        (props.method.modifiers || []).map((mod) =>
          ts.isDecorator(mod) ? operator(mod) : mod,
        ),
        props.method.asteriskToken,
        props.method.name,
        props.method.questionToken,
        props.method.typeParameters,
        props.method.parameters,
        props.method.type,
        props.method.body,
      );
    // eslint-disable-next-line
    return (ts.factory.updateMethodDeclaration as any)(
      props.method,
      decorators.map(operator),
      (props.method as any).modifiers,
      props.method.asteriskToken,
      props.method.name,
      props.method.questionToken,
      props.method.typeParameters,
      props.method.parameters,
      props.method.type,
      props.method.body,
    );
  };
}

const get_escaped_type =
  (checker: ts.TypeChecker) =>
  (type: ts.Type): ts.Type => {
    const symbol: ts.Symbol | undefined = type.getSymbol() || type.aliasSymbol;
    return symbol && get_name(symbol) === "Promise"
      ? escape_promise(checker)(type)
      : type;
  };

const escape_promise =
  (checker: ts.TypeChecker) =>
  (type: ts.Type): ts.Type => {
    const generic: readonly ts.Type[] = checker.getTypeArguments(
      type as ts.TypeReference,
    );
    if (generic.length !== 1)
      throw new Error(
        "Error on ImportAnalyzer.analyze(): invalid promise type.",
      );
    return generic[0];
  };

const get_name = (symbol: ts.Symbol): string =>
  explore_name(symbol.getDeclarations()![0].parent)(
    symbol.escapedName.toString(),
  );

const explore_name =
  (decl: ts.Node) =>
  (name: string): string =>
    ts.isModuleBlock(decl)
      ? explore_name(decl.parent.parent)(
          `${decl.parent.name.getFullText().trim()}.${name}`,
        )
      : name;
