/**
 * Reads ordinary JSON examples from the Babel AST of a freshly generated clone.
 *
 * A schema example's kind string is data, even when it resembles an AST node.
 * The retained original traversal visits Babel's finite tree and extracts only
 * literal string members of example tuples; it interprets no example as code.
 *
 * @evidence contracts/common.md#principled-implementation The original Babel-tree traversal recognizes property signatures named examples with tuple annotations, then collects literal string properties from each type-literal member. Arbitrary kind strings remain data in the returned objects.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the original structural traversal and returns its collected values; the E2E case owns parsing, the freshly generated source and independent literal expectations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader examines the actual parsed generated clone and retains the original matching predicates; no generated node or expected example is rewritten.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies finite Babel input and the distinction between ordinary example data and executable AST syntax.
 * @evidence contracts/performance.md#efficient-algorithms The original traversal visits the finite Babel tree's object fields and array entries once, with one additional bounded member scan for each matched example tuple. Work is linear in tree size plus collected example properties.
 * @evidence contracts/performance.md#reuse-equivalent-work The case supplies its already parsed fresh clone AST; the reader performs no additional parse, file read, generation or compiler request and returns all examples from one traversal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The example array and recursive visitor belong to one call and retain only copied literal string values. Recursion follows the parser's finite acyclic tree; no global state, processes or handles survive the call.
 */
export const readRichCloneTagExamples = (
  source: any,
): Array<Record<string, string>> => {
  const examples: Array<Record<string, string>> = [];
  const visit = (node: any): void => {
    if (node === null || typeof node !== "object") return;
    if (
      node.type === "TSPropertySignature" &&
      node.key.name === "examples" &&
      node.typeAnnotation?.typeAnnotation.type === "TSTupleType"
    )
      for (const element of node.typeAnnotation.typeAnnotation.elementTypes)
        if (element.type === "TSTypeLiteral") {
          const value: Record<string, string> = {};
          for (const member of element.members)
            if (
              member.type === "TSPropertySignature" &&
              member.typeAnnotation?.typeAnnotation.type === "TSLiteralType" &&
              member.typeAnnotation.typeAnnotation.literal.type ===
                "StringLiteral"
            )
              value[member.key.name] =
                member.typeAnnotation.typeAnnotation.literal.value;
          examples.push(value);
        }
    for (const value of Object.values(node))
      if (Array.isArray(value)) value.forEach(visit);
      else if (value !== null && typeof value === "object") visit(value);
  };
  visit(source);
  return examples;
};
