import path from "path";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { PlainBodyProgrammer } from "../programmers/PlainBodyProgrammer";
import { TypedBodyProgrammer } from "../programmers/TypedBodyProgrammer";
import { TypedFormDataBodyProgrammer } from "../programmers/TypedFormDataBodyProgrammer";
import { TypedHeadersProgrammer } from "../programmers/TypedHeadersProgrammer";
import { TypedParamProgrammer } from "../programmers/TypedParamProgrammer";
import { TypedQueryBodyProgrammer } from "../programmers/TypedQueryBodyProgrammer";
import { TypedQueryProgrammer } from "../programmers/TypedQueryProgrammer";

export namespace ParameterDecoratorTransformer {
  export const transform = (props: {
    context: INestiaTransformContext;
    type: ts.Type;
    decorator: ts.Decorator;
  }): ts.Decorator => {
    //----
    // VALIDATIONS
    //----
    // CHECK DECORATOR
    if (!ts.isCallExpression(props.decorator.expression))
      return props.decorator;

    // SIGNATURE DECLARATION
    const declaration: ts.Declaration | undefined =
      props.context.checker.getResolvedSignature(
        props.decorator.expression,
      )?.declaration;
    if (declaration === undefined) return props.decorator;

    // FILE PATH
    const file: string = path.resolve(declaration.getSourceFile().fileName);
    if (file.indexOf(LIB_PATH) === -1 && file.indexOf(SRC_PATH) === -1)
      return props.decorator;

    //----
    // TRANSFORMATION
    //----
    // FIND PROGRAMMER
    const programmer: Programmer | undefined =
      FUNCTORS[
        getName(props.context.checker.getTypeAtLocation(declaration).symbol)
      ];
    if (programmer === undefined) return props.decorator;

    // GET TYPE INFO
    const typeNode: ts.TypeNode | undefined =
      props.context.checker.typeToTypeNode(props.type, undefined, undefined);
    if (typeNode === undefined) return props.decorator;

    // DO TRANSFORM
    return ts.factory.createDecorator(
      ts.factory.updateCallExpression(
        props.decorator.expression,
        props.decorator.expression.expression,
        props.decorator.expression.typeArguments,
        programmer({
          context: props.context,
          modulo: props.decorator.expression.expression,
          arguments: props.decorator.expression.arguments,
          type: props.type,
        }),
      ),
    );
  };
}

type Programmer = (props: {
  context: INestiaTransformContext;
  modulo: ts.LeftHandSideExpression;
  arguments: readonly ts.Expression[];
  type: ts.Type;
}) => readonly ts.Expression[];

const FUNCTORS: Record<string, Programmer> = {
  EncryptedBody: (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedBodyProgrammer.generate(props)],
  TypedBody: (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedBodyProgrammer.generate(props)],
  TypedHeaders: (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedHeadersProgrammer.generate(props)],
  TypedParam: (props) =>
    props.arguments.length !== 1
      ? props.arguments
      : TypedParamProgrammer.generate(props),
  TypedQuery: (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedQueryProgrammer.generate(props)],
  "TypedQuery.Body": (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedQueryBodyProgrammer.generate(props)],
  "TypedFormData.Body": (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedFormDataBodyProgrammer.generate(props)],
  PlainBody: (props) =>
    props.arguments.length
      ? props.arguments
      : [PlainBodyProgrammer.generate(props)],
  "WebSocketRoute.Header": (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedBodyProgrammer.generate(props)],
  "WebSocketRoute.Param": (props) =>
    props.arguments.length !== 1
      ? props.arguments
      : TypedParamProgrammer.generate(props),
  "WebSocketRoute.Query": (props) =>
    props.arguments.length
      ? props.arguments
      : [TypedQueryProgrammer.generate(props)],
};

const LIB_PATH = path.join("@nestia", "core", "lib", "decorators");
const SRC_PATH = path.resolve(path.join(__dirname, "..", "decorators"));

const getName = (symbol: ts.Symbol): string => {
  const parent = symbol.getDeclarations()?.[0]?.parent;
  return parent ? exploreName(parent)(symbol.escapedName.toString()) : "__type";
};
const exploreName =
  (decl: ts.Node) =>
  (name: string): string =>
    ts.isModuleBlock(decl)
      ? exploreName(decl.parent.parent)(
          `${decl.parent.name.getFullText().trim()}.${name}`,
        )
      : name;
