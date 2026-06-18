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

import { TypeFactory } from "./TypeFactory";

// Conservative "is this string a syntactically valid JavaScript variable
// name?" test, inlined to avoid pulling in @typia/utils' full namespace.
const VARIABLE_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const isVariableName = (str: string): boolean => VARIABLE_REGEX.test(str);

/**
 * Identifier and member-access helpers. The surface kept here is the subset
 * nestia generators actually call (`identifier`, `access`, `parameter`).
 */
export namespace IdentifierFactory {
  /**
   * Build an identifier or string literal depending on whether `name` is a
   * valid JavaScript identifier.
   */
  export const identifier = (name: string): Identifier | StringLiteral =>
    isVariableName(name)
      ? factory.createIdentifier(name)
      : factory.createStringLiteral(name);

  /**
   * Member access on `input` by `key`. Falls back to element access when the
   * key is not a valid identifier.
   */
  export const access = (
    input: Expression,
    key: string,
    chain?: boolean,
  ): Expression => {
    const postfix = identifier(key);
    if (postfix.kind === "StringLiteral")
      return chain === true
        ? factory.createElementAccessChain(
            input,
            factory.createToken(SyntaxKind.QuestionDotToken),
            postfix,
          )
        : factory.createElementAccessExpression(input, postfix);
    return chain === true
      ? factory.createPropertyAccessChain(
          input,
          factory.createToken(SyntaxKind.QuestionDotToken),
          postfix,
        )
      : factory.createPropertyAccessExpression(input, postfix);
  };

  /**
   * Parameter declaration with default `any` type when the caller omits one.
   * Passing a `QuestionToken` as `init` marks the parameter optional.
   */
  export const parameter = (
    name: string | Identifier,
    type?: TypeNode,
    init?: Expression | Token,
  ): ParameterDeclaration => {
    const isQuestionToken =
      !!init &&
      init.kind === "Token" &&
      (init as Token).token === SyntaxKind.QuestionToken;
    return factory.createParameterDeclaration(
      undefined,
      undefined,
      name,
      isQuestionToken
        ? factory.createToken(SyntaxKind.QuestionToken)
        : undefined,
      type ?? TypeFactory.keyword("any"),
      isQuestionToken ? undefined : (init as Expression | undefined),
    );
  };
}
