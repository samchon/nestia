type Node = Record<string, any>;

const enum SyntaxKind {
  EndOfFileToken = 1,
  NumericLiteral = 9,
  BigIntLiteral = 10,
  StringLiteral = 11,
  TemplateHead = 16,
  TemplateMiddle = 17,
  TemplateTail = 18,
  DotDotDotToken = 26,
  QuestionDotToken = 29,
  EqualsEqualsEqualsToken = 37,
  EqualsGreaterThanToken = 39,
  MinusToken = 41,
  ExclamationToken = 54,
  QuestionToken = 58,
  ColonToken = 59,
  FalseKeyword = 97,
  NullKeyword = 106,
  TrueKeyword = 112,
  Identifier = 80,
  Parameter = 170,
  Decorator = 171,
  PropertySignature = 172,
  MethodDeclaration = 175,
  IndexSignature = 182,
  TypeReference = 184,
  FunctionType = 185,
  TypeQuery = 187,
  TypeLiteral = 188,
  ArrayType = 189,
  TupleType = 190,
  OptionalType = 191,
  RestType = 192,
  UnionType = 193,
  IntersectionType = 194,
  ParenthesizedType = 197,
  LiteralType = 202,
  TemplateLiteralType = 204,
  TemplateLiteralTypeSpan = 205,
  ArrayLiteralExpression = 210,
  ObjectLiteralExpression = 211,
  PropertyAccessExpression = 212,
  CallExpression = 214,
  NewExpression = 215,
  ArrowFunction = 220,
  AwaitExpression = 224,
  PrefixUnaryExpression = 225,
  BinaryExpression = 227,
  ConditionalExpression = 228,
  TemplateExpression = 229,
  AsExpression = 235,
  TemplateSpan = 240,
  Block = 242,
  VariableStatement = 244,
  ExpressionStatement = 245,
  IfStatement = 246,
  ForOfStatement = 251,
  ContinueStatement = 252,
  ReturnStatement = 254,
  ThrowStatement = 258,
  TryStatement = 259,
  VariableDeclaration = 261,
  VariableDeclarationList = 262,
  FunctionDeclaration = 263,
  ClassDeclaration = 264,
  TypeAliasDeclaration = 266,
  ModuleDeclaration = 268,
  ModuleBlock = 269,
  ImportDeclaration = 273,
  ImportClause = 274,
  NamespaceImport = 275,
  NamedImports = 276,
  ImportSpecifier = 277,
  ExportDeclaration = 279,
  NamespaceExport = 281,
  CatchClause = 300,
  PropertyAssignment = 304,
  ShorthandPropertyAssignment = 305,
  SpreadAssignment = 306,
  SourceFile = 308,
  QualifiedName = 167,
  ArrayBindingPattern = 208,
  BindingElement = 209,
}

const NodeFlags = {
  Synthesized: 16,
  OptionalChain: 64,
} as const;

const node = (kind: number, props: Node = {}): Node => ({
  pos: -1,
  end: -1,
  kind,
  id: 0,
  flags: NodeFlags.Synthesized,
  modifierFlagsCache: 0,
  transformFlags: 0,
  original: undefined,
  emitNode: undefined,
  ...props,
});

const nodeArray = <T extends Node>(items: readonly T[] | undefined): T[] => {
  const array: T[] = [...(items ?? [])];
  return Object.assign(array, {
    pos: -1,
    end: -1,
    hasTrailingComma: false,
    transformFlags: 0,
  });
};

const asName = (input: string | Node): Node =>
  typeof input === "string" ? TypeScriptFactory.createIdentifier(input) : input;

const asModuleSpecifier = (input: string | Node): Node =>
  typeof input === "string"
    ? TypeScriptFactory.createStringLiteral(input)
    : input;

const asToken = (input: number | Node | undefined): Node | undefined =>
  typeof input === "number" ? TypeScriptFactory.createToken(input) : input;

const implementation = {
  createIdentifier(text: string): Node {
    return node(SyntaxKind.Identifier, {
      escapedText: text,
      text,
      jsDoc: undefined,
      flowNode: undefined,
    });
  },

  createStringLiteral(text: string, isSingleQuote?: boolean): Node {
    return node(SyntaxKind.StringLiteral, {
      text,
      singleQuote: isSingleQuote,
      hasExtendedUnicodeEscape: undefined,
    });
  },

  createNumericLiteral(value: string | number): Node {
    return node(SyntaxKind.NumericLiteral, {
      text: String(value),
      numericLiteralFlags: 0,
    });
  },

  createBigIntLiteral(value: string | number | bigint): Node {
    const text: string = String(value).replace(/n$/i, "");
    return node(SyntaxKind.BigIntLiteral, { text, transformFlags: 32 });
  },

  createTrue(): Node {
    return TypeScriptFactory.createToken(SyntaxKind.TrueKeyword);
  },

  createFalse(): Node {
    return TypeScriptFactory.createToken(SyntaxKind.FalseKeyword);
  },

  createNull(): Node {
    return TypeScriptFactory.createToken(SyntaxKind.NullKeyword);
  },

  createToken(kind: number): Node {
    return node(kind);
  },

  createModifier(kind: number): Node {
    return node(kind);
  },

  createDecorator(expression: Node): Node {
    return node(SyntaxKind.Decorator, { expression, transformFlags: 33562624 });
  },

  createArrayBindingPattern(elements: readonly Node[]): Node {
    return node(SyntaxKind.ArrayBindingPattern, {
      elements: nodeArray(elements),
    });
  },

  createBindingElement(
    dotDotDotToken: Node | undefined,
    propertyName: string | Node | undefined,
    name: string | Node,
    initializer?: Node,
  ): Node {
    return node(SyntaxKind.BindingElement, {
      dotDotDotToken,
      propertyName:
        propertyName === undefined ? undefined : asName(propertyName),
      name: asName(name),
      initializer,
    });
  },

  createQualifiedName(left: string | Node, right: string | Node): Node {
    return node(SyntaxKind.QualifiedName, {
      left: asName(left),
      right: asName(right),
    });
  },

  createPropertyAccessExpression(expression: Node, name: string | Node): Node {
    return node(SyntaxKind.PropertyAccessExpression, {
      expression,
      questionDotToken: undefined,
      name: asName(name),
      jsDoc: undefined,
      flowNode: undefined,
    });
  },

  createPropertyAccessChain(
    expression: Node,
    questionDotToken: Node | undefined,
    name: string | Node,
  ): Node {
    return {
      ...TypeScriptFactory.createPropertyAccessExpression(expression, name),
      flags: NodeFlags.Synthesized | NodeFlags.OptionalChain,
      questionDotToken:
        questionDotToken ?? TypeScriptFactory.createToken(SyntaxKind.QuestionDotToken),
      transformFlags: 32,
    };
  },

  createCallExpression(
    expression: Node,
    typeArguments?: readonly Node[],
    args?: readonly Node[],
  ): Node {
    return node(SyntaxKind.CallExpression, {
      expression,
      questionDotToken: undefined,
      typeArguments: typeArguments ? nodeArray(typeArguments) : undefined,
      arguments: nodeArray(args),
    });
  },

  createCallChain(
    expression: Node,
    questionDotToken?: Node,
    typeArguments?: readonly Node[],
    args?: readonly Node[],
  ): Node {
    return {
      ...TypeScriptFactory.createCallExpression(expression, typeArguments, args),
      flags: NodeFlags.Synthesized | NodeFlags.OptionalChain,
      questionDotToken:
        questionDotToken ?? TypeScriptFactory.createToken(SyntaxKind.QuestionDotToken),
      transformFlags: 32,
    };
  },

  createNewExpression(
    expression: Node,
    typeArguments?: readonly Node[],
    args?: readonly Node[],
  ): Node {
    return node(SyntaxKind.NewExpression, {
      expression,
      typeArguments: typeArguments ? nodeArray(typeArguments) : undefined,
      arguments: args ? nodeArray(args) : undefined,
    });
  },

  createArrayLiteralExpression(
    elements: readonly Node[] = [],
    multiLine?: boolean,
  ): Node {
    return node(SyntaxKind.ArrayLiteralExpression, {
      elements: nodeArray(elements),
      multiLine: !!multiLine,
    });
  },

  createObjectLiteralExpression(
    properties: readonly Node[] = [],
    multiLine?: boolean,
  ): Node {
    return node(SyntaxKind.ObjectLiteralExpression, {
      properties: nodeArray(properties),
      multiLine: !!multiLine,
    });
  },

  createPropertyAssignment(name: string | Node, initializer: Node): Node {
    return node(SyntaxKind.PropertyAssignment, {
      name: asName(name),
      initializer,
    });
  },

  createShorthandPropertyAssignment(
    name: string | Node,
    objectAssignmentInitializer?: Node,
  ): Node {
    return node(SyntaxKind.ShorthandPropertyAssignment, {
      name: asName(name),
      objectAssignmentInitializer,
    });
  },

  createSpreadAssignment(expression: Node): Node {
    return node(SyntaxKind.SpreadAssignment, { expression });
  },

  createExpressionStatement(expression: Node): Node {
    return node(SyntaxKind.ExpressionStatement, { expression });
  },

  createBlock(statements: readonly Node[] = [], multiLine?: boolean): Node {
    return node(SyntaxKind.Block, {
      statements: nodeArray(statements),
      multiLine: !!multiLine,
    });
  },

  createReturnStatement(expression?: Node): Node {
    return node(SyntaxKind.ReturnStatement, { expression });
  },

  createIfStatement(
    expression: Node,
    thenStatement: Node,
    elseStatement?: Node,
  ): Node {
    return node(SyntaxKind.IfStatement, {
      expression,
      thenStatement,
      elseStatement,
    });
  },

  createContinueStatement(label?: string | Node): Node {
    return node(SyntaxKind.ContinueStatement, {
      label: label === undefined ? undefined : asName(label),
    });
  },

  createForOfStatement(
    awaitModifier: Node | undefined,
    initializer: Node,
    expression: Node,
    statement: Node,
  ): Node {
    return node(SyntaxKind.ForOfStatement, {
      awaitModifier,
      initializer,
      expression,
      statement,
    });
  },

  createThrowStatement(expression: Node): Node {
    return node(SyntaxKind.ThrowStatement, { expression });
  },

  createTryStatement(
    tryBlock: Node,
    catchClause?: Node,
    finallyBlock?: Node,
  ): Node {
    return node(SyntaxKind.TryStatement, {
      tryBlock,
      catchClause,
      finallyBlock,
    });
  },

  createCatchClause(
    variableDeclaration: string | Node | undefined,
    block: Node,
  ): Node {
    return node(SyntaxKind.CatchClause, {
      variableDeclaration:
        typeof variableDeclaration === "string"
          ? TypeScriptFactory.createVariableDeclaration(variableDeclaration)
          : variableDeclaration,
      block,
    });
  },

  createAwaitExpression(expression: Node): Node {
    return node(SyntaxKind.AwaitExpression, { expression, transformFlags: 32 });
  },

  createAsExpression(expression: Node, type: Node): Node {
    return node(SyntaxKind.AsExpression, { expression, type, transformFlags: 1 });
  },

  createConditionalExpression(
    condition: Node,
    questionToken: Node | undefined,
    whenTrue: Node,
    colonToken: Node | undefined,
    whenFalse: Node,
  ): Node {
    return node(SyntaxKind.ConditionalExpression, {
      condition,
      questionToken: questionToken ?? TypeScriptFactory.createToken(SyntaxKind.QuestionToken),
      whenTrue,
      colonToken: colonToken ?? TypeScriptFactory.createToken(SyntaxKind.ColonToken),
      whenFalse,
    });
  },

  createBinaryExpression(
    left: Node,
    operator: Node | number,
    right: Node,
  ): Node {
    return node(SyntaxKind.BinaryExpression, {
      left,
      operatorToken: asToken(operator),
      right,
    });
  },

  createStrictEquality(left: Node, right: Node): Node {
    return TypeScriptFactory.createBinaryExpression(
      left,
      SyntaxKind.EqualsEqualsEqualsToken,
      right,
    );
  },

  createPrefixUnaryExpression(operator: number, operand: Node): Node {
    return node(SyntaxKind.PrefixUnaryExpression, { operator, operand });
  },

  createPrefixMinus(operand: Node): Node {
    return TypeScriptFactory.createPrefixUnaryExpression(
      SyntaxKind.MinusToken,
      operand,
    );
  },

  createLogicalNot(operand: Node): Node {
    return TypeScriptFactory.createPrefixUnaryExpression(
      SyntaxKind.ExclamationToken,
      operand,
    );
  },

  createArrowFunction(
    modifiers: readonly Node[] | undefined,
    typeParameters: readonly Node[] | undefined,
    parameters: readonly Node[],
    type: Node | undefined,
    equalsGreaterThanToken: Node | undefined,
    body: Node,
  ): Node {
    return node(SyntaxKind.ArrowFunction, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      parameters: nodeArray(parameters),
      type,
      equalsGreaterThanToken:
        equalsGreaterThanToken ??
        TypeScriptFactory.createToken(SyntaxKind.EqualsGreaterThanToken),
      body,
      typeArguments: undefined,
      jsDoc: undefined,
      locals: undefined,
      nextContainer: undefined,
      endFlowNode: undefined,
      returnFlowNode: undefined,
    });
  },

  createFunctionDeclaration(
    modifiers: readonly Node[] | undefined,
    asteriskToken: Node | undefined,
    name: string | Node | undefined,
    typeParameters: readonly Node[] | undefined,
    parameters: readonly Node[] = [],
    type: Node | undefined,
    body: Node | undefined,
  ): Node {
    return node(SyntaxKind.FunctionDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      asteriskToken,
      name: name === undefined ? undefined : asName(name),
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      parameters: nodeArray(parameters),
      type,
      body,
      typeArguments: undefined,
      jsDoc: undefined,
      locals: undefined,
      nextContainer: undefined,
      endFlowNode: undefined,
      returnFlowNode: undefined,
    });
  },

  createClassDeclaration(
    modifiers: readonly Node[] | undefined,
    name: string | Node | undefined,
    typeParameters: readonly Node[] | undefined,
    heritageClauses: readonly Node[] | undefined,
    members: readonly Node[] = [],
  ): Node {
    return node(SyntaxKind.ClassDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      name: name === undefined ? undefined : asName(name),
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      heritageClauses: heritageClauses ? nodeArray(heritageClauses) : undefined,
      members: nodeArray(members),
      jsDoc: undefined,
      locals: undefined,
      nextContainer: undefined,
      endFlowNode: undefined,
    });
  },

  updateClassDeclaration(
    original: Node,
    modifiers: readonly Node[] | undefined,
    name: string | Node | undefined,
    typeParameters: readonly Node[] | undefined,
    heritageClauses: readonly Node[] | undefined,
    members: readonly Node[],
  ): Node {
    return {
      ...original,
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      name: name === undefined ? undefined : asName(name),
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      heritageClauses: heritageClauses ? nodeArray(heritageClauses) : undefined,
      members: nodeArray(members),
    };
  },

  createMethodDeclaration(
    modifiers: readonly Node[] | undefined,
    asteriskToken: Node | undefined,
    name: string | Node,
    questionToken: Node | undefined,
    typeParameters: readonly Node[] | undefined,
    parameters: readonly Node[],
    type: Node | undefined,
    body: Node | undefined,
  ): Node {
    return node(SyntaxKind.MethodDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      asteriskToken,
      name: asName(name),
      questionToken,
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      parameters: nodeArray(parameters),
      type,
      body,
      typeArguments: undefined,
      jsDoc: undefined,
      locals: undefined,
      nextContainer: undefined,
      endFlowNode: undefined,
      returnFlowNode: undefined,
    });
  },

  updateMethodDeclaration(
    original: Node,
    modifiers: readonly Node[] | undefined,
    asteriskToken: Node | undefined,
    name: string | Node,
    questionToken: Node | undefined,
    typeParameters: readonly Node[] | undefined,
    parameters: readonly Node[],
    type: Node | undefined,
    body: Node | undefined,
  ): Node {
    return {
      ...original,
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      asteriskToken,
      name: asName(name),
      questionToken,
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      parameters: nodeArray(parameters),
      type,
      body,
    };
  },

  createParameterDeclaration(
    modifiers: readonly Node[] | undefined,
    dotDotDotToken: Node | undefined,
    name: string | Node,
    questionToken?: Node,
    type?: Node,
    initializer?: Node,
  ): Node {
    return node(SyntaxKind.Parameter, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      dotDotDotToken,
      name: asName(name),
      questionToken,
      type,
      initializer,
      jsDoc: undefined,
    });
  },

  createVariableDeclaration(
    name: string | Node,
    exclamationToken?: Node,
    type?: Node,
    initializer?: Node,
  ): Node {
    return node(SyntaxKind.VariableDeclaration, {
      name: asName(name),
      exclamationToken,
      type,
      initializer,
    });
  },

  createVariableDeclarationList(
    declarations: readonly Node[],
    flags = 0,
  ): Node {
    return node(SyntaxKind.VariableDeclarationList, {
      flags,
      declarations: nodeArray(declarations),
    });
  },

  createVariableStatement(
    modifiers: readonly Node[] | undefined,
    declarationList: Node,
  ): Node {
    return node(SyntaxKind.VariableStatement, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      declarationList,
      jsDoc: undefined,
    });
  },

  createTypeAliasDeclaration(
    modifiers: readonly Node[] | undefined,
    name: string | Node,
    typeParameters: readonly Node[] | undefined,
    type: Node,
  ): Node {
    return node(SyntaxKind.TypeAliasDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      name: asName(name),
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      type,
      jsDoc: undefined,
      locals: undefined,
      nextContainer: undefined,
    });
  },

  createModuleDeclaration(
    modifiers: readonly Node[] | undefined,
    name: string | Node,
    body?: Node,
    flags = 0,
  ): Node {
    return node(SyntaxKind.ModuleDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      name: asName(name),
      body,
      flags: NodeFlags.Synthesized | flags,
      jsDoc: undefined,
      locals: undefined,
      nextContainer: undefined,
    });
  },

  createModuleBlock(statements: readonly Node[] = []): Node {
    return node(SyntaxKind.ModuleBlock, { statements: nodeArray(statements) });
  },

  createImportDeclaration(
    modifiers: readonly Node[] | undefined,
    importClause: Node | undefined,
    moduleSpecifier: string | Node,
    attributes?: Node,
  ): Node {
    return node(SyntaxKind.ImportDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      importClause,
      moduleSpecifier: asModuleSpecifier(moduleSpecifier),
      assertClause: undefined,
      attributes,
      jsDoc: undefined,
    });
  },

  createImportClause(
    isTypeOnly: boolean,
    name: string | Node | undefined,
    namedBindings?: Node,
  ): Node {
    return node(SyntaxKind.ImportClause, {
      isTypeOnly,
      name: name === undefined ? undefined : asName(name),
      namedBindings,
    });
  },

  createNamespaceImport(name: string | Node): Node {
    return node(SyntaxKind.NamespaceImport, { name: asName(name) });
  },

  createNamedImports(elements: readonly Node[]): Node {
    return node(SyntaxKind.NamedImports, { elements: nodeArray(elements) });
  },

  createImportSpecifier(
    isTypeOnly: boolean,
    propertyName: string | Node | undefined,
    name: string | Node,
  ): Node {
    return node(SyntaxKind.ImportSpecifier, {
      isTypeOnly,
      propertyName:
        propertyName === undefined ? undefined : asName(propertyName),
      name: asName(name),
    });
  },

  createExportDeclaration(
    modifiers: readonly Node[] | undefined,
    isTypeOnly: boolean,
    exportClause: Node | undefined,
    moduleSpecifier?: string | Node,
    attributes?: Node,
  ): Node {
    return node(SyntaxKind.ExportDeclaration, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      isTypeOnly,
      exportClause,
      moduleSpecifier:
        moduleSpecifier === undefined
          ? undefined
          : asModuleSpecifier(moduleSpecifier),
      assertClause: undefined,
      attributes,
      jsDoc: undefined,
    });
  },

  createNamespaceExport(name: string | Node): Node {
    return node(SyntaxKind.NamespaceExport, { name: asName(name) });
  },

  createKeywordTypeNode(kind: number): Node {
    return node(kind);
  },

  createTypeReferenceNode(
    typeName: string | Node,
    typeArguments?: readonly Node[],
  ): Node {
    return node(SyntaxKind.TypeReference, {
      typeName: asName(typeName),
      typeArguments: typeArguments ? nodeArray(typeArguments) : undefined,
    });
  },

  createTypeQueryNode(exprName: string | Node): Node {
    return node(SyntaxKind.TypeQuery, { exprName: asName(exprName) });
  },

  createTypeLiteralNode(members: readonly Node[] = []): Node {
    return node(SyntaxKind.TypeLiteral, { members: nodeArray(members) });
  },

  createArrayTypeNode(elementType: Node): Node {
    return node(SyntaxKind.ArrayType, {
      elementType:
        elementType.kind === SyntaxKind.UnionType ||
        elementType.kind === SyntaxKind.IntersectionType
          ? TypeScriptFactory.createParenthesizedType(elementType)
          : elementType,
    });
  },

  createParenthesizedType(type: Node): Node {
    return node(SyntaxKind.ParenthesizedType, { type });
  },

  createTupleTypeNode(elements: readonly Node[] = []): Node {
    return node(SyntaxKind.TupleType, { elements: nodeArray(elements) });
  },

  createUnionTypeNode(types: readonly Node[] = []): Node {
    return node(SyntaxKind.UnionType, { types: nodeArray(types) });
  },

  createIntersectionTypeNode(types: readonly Node[] = []): Node {
    return node(SyntaxKind.IntersectionType, { types: nodeArray(types) });
  },

  createLiteralTypeNode(literal: Node): Node {
    return node(SyntaxKind.LiteralType, { literal });
  },

  createRestTypeNode(type: Node): Node {
    return node(SyntaxKind.RestType, { type });
  },

  createOptionalTypeNode(type: Node): Node {
    return node(SyntaxKind.OptionalType, { type });
  },

  createFunctionTypeNode(
    typeParameters: readonly Node[] | undefined,
    parameters: readonly Node[],
    type: Node,
  ): Node {
    return node(SyntaxKind.FunctionType, {
      typeParameters: typeParameters ? nodeArray(typeParameters) : undefined,
      parameters: nodeArray(parameters),
      type,
    });
  },

  createPropertySignature(
    modifiers: readonly Node[] | undefined,
    name: string | Node,
    questionToken: Node | undefined,
    type: Node | undefined,
  ): Node {
    return node(SyntaxKind.PropertySignature, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      name: asName(name),
      questionToken,
      type,
      jsDoc: undefined,
    });
  },

  createIndexSignature(
    modifiers: readonly Node[] | undefined,
    parameters: readonly Node[],
    type: Node,
  ): Node {
    return node(SyntaxKind.IndexSignature, {
      modifiers: modifiers ? nodeArray(modifiers) : undefined,
      parameters: nodeArray(parameters),
      type,
    });
  },

  createTemplateHead(text: string, rawText = text): Node {
    return node(SyntaxKind.TemplateHead, { text, rawText });
  },

  createTemplateMiddle(text: string, rawText = text): Node {
    return node(SyntaxKind.TemplateMiddle, { text, rawText });
  },

  createTemplateTail(text: string, rawText = text): Node {
    return node(SyntaxKind.TemplateTail, { text, rawText });
  },

  createTemplateSpan(expression: Node, literal: Node): Node {
    return node(SyntaxKind.TemplateSpan, { expression, literal });
  },

  createTemplateExpression(head: Node, templateSpans: readonly Node[]): Node {
    return node(SyntaxKind.TemplateExpression, {
      head,
      templateSpans: nodeArray(templateSpans),
    });
  },

  createTemplateLiteralType(head: Node, templateSpans: readonly Node[]): Node {
    return node(SyntaxKind.TemplateLiteralType, {
      head,
      templateSpans: nodeArray(templateSpans),
    });
  },

  createTemplateLiteralTypeSpan(type: Node, literal: Node): Node {
    return node(SyntaxKind.TemplateLiteralTypeSpan, { type, literal });
  },

  createSourceFile(
    statements: readonly Node[],
    endOfFileToken?: Node,
    flags = 0,
  ): Node {
    return node(SyntaxKind.SourceFile, {
      flags,
      statements: nodeArray(statements),
      endOfFileToken:
        endOfFileToken ?? TypeScriptFactory.createToken(SyntaxKind.EndOfFileToken),
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
  },

  updateSourceFile(file: Node, statements: readonly Node[]): Node {
    return { ...file, statements: nodeArray(statements) };
  },
};

export const TypeScriptFactory: any = implementation;
export const factory: any = TypeScriptFactory;
export default TypeScriptFactory;
