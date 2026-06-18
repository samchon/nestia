import {
  type Expression,
  type Identifier,
  type ParameterDeclaration,
  type StringLiteral,
  SyntaxKind,
  type Token,
  type TypeNode,
  factory,
} from "@ttsc/factory";
import { NamingConvention } from "@typia/utils";

import { TypeFactory } from "./TypeFactory";

/**
 * Identifier / property-access / parameter helpers, mirroring `@typia/core`'s
 * `IdentifierFactory`, built on `@ttsc/factory` so no `typescript` runtime is
 * bundled.
 */
export namespace IdentifierFactory {
  export const identifier = (name: string): Identifier | StringLiteral =>
    NamingConvention.variable(name)
      ? factory.createIdentifier(name)
      : factory.createStringLiteral(name);

  export const access = (
    input: Expression,
    key: string,
    chain?: boolean,
  ): Expression => {
    const postfix: Identifier | StringLiteral = identifier(key);
    return postfix.kind === "StringLiteral"
      ? chain === true
        ? factory.createElementAccessChain(
            input,
            factory.createToken(SyntaxKind.QuestionDotToken),
            postfix,
          )
        : factory.createElementAccessExpression(input, postfix)
      : chain === true
        ? factory.createPropertyAccessChain(
            input,
            factory.createToken(SyntaxKind.QuestionDotToken),
            postfix,
          )
        : factory.createPropertyAccessExpression(input, postfix);
  };

  export const parameter = (
    name: string | Identifier,
    type?: TypeNode,
    init?: Expression | Token,
  ): ParameterDeclaration => {
    // a question token passed as `init` marks the parameter optional (`x?:`),
    // mirroring `@typia/core`'s IdentifierFactory.parameter
    const optional: boolean =
      init !== undefined &&
      init.kind === "Token" &&
      init.token === SyntaxKind.QuestionToken;
    return factory.createParameterDeclaration(
      undefined,
      undefined,
      name,
      optional ? factory.createToken(SyntaxKind.QuestionToken) : undefined,
      type ?? TypeFactory.keyword("any"),
      optional ? undefined : (init as Expression | undefined),
    );
  };
}
