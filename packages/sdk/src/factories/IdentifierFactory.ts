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
 *
 * @evidence contracts/common.md#principled-implementation The functions choose an identifier or a string literal by the syntax of the name, so any string can be a key.
 * @evidence contracts/common.md#clear-and-simple-design Three functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The identifier test is inlined and conservative.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation IdentifierFactory constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace IdentifierFactory {
  /**
   * Build an identifier or string literal depending on whether `name` is a
   * valid JavaScript identifier.
   *
   * @evidence contracts/common.md#principled-implementation The name is tested against the identifier grammar, and a valid name outside the conservative pattern becomes an equivalent quoted key.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The test applies to every name.
   * @evidence contracts/common.md#meaningful-documentation The comment states the two results.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IdentifierFactory.identifier constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const identifier = (name: string): Identifier | StringLiteral =>
    isVariableName(name)
      ? factory.createIdentifier(name)
      : factory.createStringLiteral(name);

  /**
   * Member access on `input` by `key`. Falls back to element access when the
   * key is not a valid identifier.
   *
   * @evidence contracts/common.md#principled-implementation The key becomes a property when it is an identifier and an element access otherwise.
   * @evidence contracts/common.md#clear-and-simple-design One function delegating the naming rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It never concatenates source text.
   * @evidence contracts/common.md#meaningful-documentation The comment states the forms.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IdentifierFactory.access constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
   *
   * @evidence contracts/common.md#principled-implementation The question token becomes the optional marker and any other initializer is passed through.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the declaration grammar.
   * @evidence contracts/common.md#meaningful-documentation The comment states the optional marker.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IdentifierFactory.parameter constructs TypeScript syntax nodes; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
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
