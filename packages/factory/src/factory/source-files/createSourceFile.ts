import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";
import { createNode } from "../../utils/createNode";
import { createNodeArray } from "../../utils/createNodeArray";
import { createToken } from "../tokens/createToken";

export function createSourceFile(
  statements: readonly Node[],
  endOfFileToken?: Node,
  flags = 0,
): Node {
  return createNode(SyntaxKind.SourceFile, {
    flags,
    statements: createNodeArray(statements),
    endOfFileToken: endOfFileToken ?? createToken(SyntaxKind.EndOfFileToken),
    text: "",
    fileName: "",
    path: "",
    languageVersion: 99,
    languageVariant: 0,
    scriptKind: 3,
    isDeclarationFile: false,
    hasNoDefaultLib: false,
    locals: undefined,
    nextContainer: undefined,
    endFlowNode: undefined,
    nodeCount: 0,
    identifierCount: 0,
    symbolCount: 0,
    parseDiagnostics: [],
    bindDiagnostics: [],
    bindSuggestionDiagnostics: undefined,
    lineMap: undefined,
    externalModuleIndicator: undefined,
    setExternalModuleIndicator: undefined,
    pragmas: new Map(),
    checkJsDirective: undefined,
    referencedFiles: [],
    typeReferenceDirectives: [],
    libReferenceDirectives: [],
    amdDependencies: [],
    commentDirectives: undefined,
    identifiers: new Map(),
    packageJsonLocations: undefined,
    packageJsonScope: undefined,
    imports: [],
    moduleAugmentations: [],
    ambientModuleNames: [],
    classifiableNames: undefined,
    impliedNodeFormat: undefined,
  });
}
