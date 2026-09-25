import { type Expression, SyntaxKind, factory } from "@ttsc/factory";

import { PathAnalyzer } from "../../analyses/PathAnalyzer";

export namespace SdkPathTemplate {
  /**
   * The expression an SDK function builds its route's path with: the literal
   * text of the path, each parameter filled in with the URI-encoded value
   * `argument` names for it, or `"null"` when that value is nullish.
   *
   * The positions come from {@link PathAnalyzer.segments}, as the server's
   * router reads the path, so a parameter with literal text beside it in its
   * segment, such as `/files/:id.json` or `/range/:from-:to`, is filled in
   * where it stands.
   */
  export const compose = (props: {
    path: string;
    argument: (name: string) => Expression;
  }): Expression => {
    const segments: PathAnalyzer.ISegment[] | null = PathAnalyzer.segments(
      props.path,
    );
    if (
      segments === null ||
      segments.every((segment) => segment.type === "literal")
    )
      return factory.createStringLiteral(props.path);

    // a template holds a literal between every two expressions
    const literals: string[] = [""];
    const parameters: string[] = [];
    for (const segment of segments)
      if (segment.type === "literal")
        literals[literals.length - 1] += segment.value;
      else {
        parameters.push(segment.name);
        literals.push("");
      }
    return factory.createTemplateExpression(
      factory.createTemplateHead(literals[0]!),
      parameters.map((name, i) =>
        factory.createTemplateSpan(
          factory.createCallExpression(
            factory.createIdentifier("encodeURIComponent"),
            undefined,
            [
              factory.createBinaryExpression(
                factory.createCallChain(
                  factory.createPropertyAccessChain(
                    props.argument(name),
                    factory.createToken(SyntaxKind.QuestionDotToken),
                    "toString",
                  ),
                  undefined,
                  undefined,
                  [],
                ),
                factory.createToken(SyntaxKind.QuestionQuestionToken),
                factory.createStringLiteral("null"),
              ),
            ],
          ),
          (i !== parameters.length - 1
            ? factory.createTemplateMiddle
            : factory.createTemplateTail)(literals[i + 1]!),
        ),
      ),
    );
  };
}
