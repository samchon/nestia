import { type Expression, factory } from "@ttsc/factory";

import { PathAnalyzer } from "../../analyses/PathAnalyzer";
import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { ImportDictionary } from "./ImportDictionary";

export namespace SdkPathTemplate {
  /**
   * The expression an SDK function builds its route's path with: the literal
   * text of the path, each parameter filled in by `PathParameter.encode()` of
   * `@nestia/fetcher` with the value `argument` names for it: URI-encoded, or
   * `"null"` when nullish, and refused when it is a dot segment (`.`, `..`) the
   * URL would resolve away.
   *
   * The positions come from {@link PathAnalyzer.segments}, as the server's
   * router reads the path, so a parameter with literal text beside it in its
   * segment, such as `/files/:id.json` or `/range/:from-:to`, is filled in
   * where it stands.
   */
  export const compose = (props: {
    importer: ImportDictionary;
    path: string;
    argument: (name: string) => Expression;
  }): Expression => {
    const segments: PathAnalyzer.ISegment[] | null = PathAnalyzer.segments(
      props.path,
    );
    if (segments === null) return factory.createStringLiteral(props.path);
    // the literal text as the router reads it, an escaped `\:` unescaped
    else if (segments.every((segment) => segment.type === "literal"))
      return factory.createStringLiteral(
        segments
          .map((segment) => (segment.type === "literal" ? segment.value : ""))
          .join(""),
      );

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
            IdentifierFactory.access(
              factory.createIdentifier(
                props.importer.external({
                  declaration: false,
                  file: "@nestia/fetcher",
                  type: "element",
                  name: "PathParameter",
                }),
              ),
              "encode",
            ),
            undefined,
            [factory.createStringLiteral(name), props.argument(name)],
          ),
          (i !== parameters.length - 1
            ? factory.createTemplateMiddle
            : factory.createTemplateTail)(literals[i + 1]!),
        ),
      ),
    );
  };
}
