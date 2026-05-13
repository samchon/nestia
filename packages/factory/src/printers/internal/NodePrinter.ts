import { NodeFlags } from "../../constants/NodeFlags";
import { SyntaxKind } from "../../constants/SyntaxKind";
import type { Node } from "../../structures/Node";

export class NodePrinter {
  public printFile(file: Node): string {
    const script: string = this.printStatementList(file.statements ?? []);
    return script.length ? `${script}\n` : "";
  }

  public printNode(node: Node): string {
    return this.printAny(node);
  }

  public printStatements(statements: readonly Node[]): string {
    const script: string = this.printStatementList(statements);
    return script.length ? `${script}\n` : "";
  }

  private printStatementList(statements: readonly Node[]): string {
    return statements
      .map((stmt) =>
        this.printWithLeadingComments(stmt, () => this.printStatement(stmt)),
      )
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  private printMemberList(members: readonly Node[]): string {
    return members
      .map((member) =>
        this.printWithLeadingComments(member, () => this.printMember(member)),
      )
      .join("\n");
  }

  private printWithLeadingComments(
    node: Node | undefined,
    body: () => string,
  ): string {
    const comments = node?.emitNode?.leadingComments ?? [];
    if (comments.length === 0) return body();
    return [
      ...comments.map((comment) =>
        comment.kind === SyntaxKind.MultiLineCommentTrivia
          ? `/*${comment.text}*/`
          : `//${comment.text}`,
      ),
      body(),
    ].join("\n");
  }

  private printStatement(stmt: Node): string {
    switch (stmt.kind) {
      case SyntaxKind.SourceFile:
        return this.printStatementList(stmt.statements ?? []);
      case SyntaxKind.ImportDeclaration:
        return this.printImportDeclaration(stmt);
      case SyntaxKind.ExportDeclaration:
        return this.printExportDeclaration(stmt);
      case SyntaxKind.ModuleDeclaration:
        return this.printModuleDeclaration(stmt);
      case SyntaxKind.ClassDeclaration:
        return this.printClassDeclaration(stmt);
      case SyntaxKind.FunctionDeclaration:
        return this.printFunctionDeclaration(stmt);
      case SyntaxKind.TypeAliasDeclaration:
        return this.printTypeAliasDeclaration(stmt);
      case SyntaxKind.VariableStatement:
        return `${this.printModifierPrefix(stmt.modifiers)}${this.printVariableDeclarationList(stmt.declarationList!)};`;
      case SyntaxKind.ExpressionStatement:
        if (
          stmt.expression?.kind === SyntaxKind.Identifier &&
          stmt.expression.text === "\n"
        )
          return "";
        return `${this.printExpression(stmt.expression)};`;
      case SyntaxKind.ReturnStatement:
        return stmt.expression
          ? `return ${this.printExpression(stmt.expression)};`
          : "return;";
      case SyntaxKind.IfStatement:
        return this.printIfStatement(stmt);
      case SyntaxKind.ForOfStatement:
        return this.printForOfStatement(stmt);
      case SyntaxKind.ContinueStatement:
        return "continue;";
      case SyntaxKind.ThrowStatement:
        return `throw ${this.printExpression(stmt.expression)};`;
      case SyntaxKind.TryStatement:
        return this.printTryStatement(stmt);
      case SyntaxKind.Block:
        return this.printBlock(stmt);
      default:
        return `${this.printExpression(stmt)};`;
    }
  }

  private printMember(member: Node): string {
    if (this.isNewLine(member)) return "";
    switch (member.kind) {
      case SyntaxKind.MethodDeclaration:
        return this.printMethodDeclaration(member);
      case SyntaxKind.PropertySignature:
      case SyntaxKind.IndexSignature:
        return this.printTypeMember(member);
      case SyntaxKind.TypeAliasDeclaration:
      case SyntaxKind.VariableStatement:
      case SyntaxKind.FunctionDeclaration:
      case SyntaxKind.ModuleDeclaration:
      case SyntaxKind.ClassDeclaration:
        return this.printStatement(member);
      default:
        return this.printStatement(member);
    }
  }

  private printImportDeclaration(node: Node): string {
    const clause: string =
      node.importClause === undefined
        ? ""
        : `${this.printImportClause(node.importClause)} `;
    return `${this.printModifierPrefix(node.modifiers)}import ${clause}from ${this.printExpression(
      node.moduleSpecifier,
    )};`;
  }

  private printImportClause(node: Node): string {
    const chunks: string[] = [];
    if (node.name !== undefined)
      chunks.push(
        `${node.isTypeOnly ? "type " : ""}${this.printName(node.name)}`,
      );
    if (node.namedBindings !== undefined)
      chunks.push(this.printImportBindings(node.namedBindings));
    return chunks.join(", ");
  }

  private printImportBindings(node: Node): string {
    if (node.kind === SyntaxKind.NamespaceImport)
      return `* as ${this.printName(node.name!)}`;
    if (node.kind === SyntaxKind.NamedImports)
      return `{ ${(node.elements ?? [])
        .map((elem) => this.printImportSpecifier(elem))
        .join(", ")} }`;
    return this.printAny(node);
  }

  private printImportSpecifier(node: Node): string {
    const prefix: string = node.isTypeOnly ? "type " : "";
    const name: string = this.printName(node.name!);
    return node.propertyName === undefined
      ? `${prefix}${name}`
      : `${prefix}${this.printName(node.propertyName)} as ${name}`;
  }

  private printExportDeclaration(node: Node): string {
    const clause: string =
      node.exportClause === undefined
        ? "*"
        : this.printExportClause(node.exportClause);
    const specifier: string =
      node.moduleSpecifier === undefined
        ? ""
        : ` from ${this.printExpression(node.moduleSpecifier)}`;
    return `${this.printModifierPrefix(node.modifiers)}export ${
      node.isTypeOnly ? "type " : ""
    }${clause}${specifier};`;
  }

  private printExportClause(node: Node): string {
    if (node.kind === SyntaxKind.NamespaceExport)
      return `* as ${this.printName(node.name!)}`;
    return this.printAny(node);
  }

  private printModuleDeclaration(node: Node): string {
    const header: string = `${this.printModifierPrefix(node.modifiers)}${
      node.flags & NodeFlags.Namespace ? "namespace" : "module"
    } ${this.printName(node.name!)}`;
    if (node.body === undefined) return `${header};`;
    return `${header} ${this.printModuleBody(node.body)}`;
  }

  private printModuleBody(node: Node): string {
    const statements = node.statements ?? [];
    if (statements.length === 0) return "{}";
    return `{\n${this.indent(this.printStatementList(statements))}\n}`;
  }

  private printClassDeclaration(node: Node): string {
    const decorators: string = this.printDecorators(node.modifiers);
    const modifiers: string = this.printModifierKeywords(node.modifiers);
    const header: string = `${modifiers ? `${modifiers} ` : ""}class ${
      node.name === undefined ? "" : this.printName(node.name)
    }${this.printTypeParameters(node.typeParameters)}`;
    const members = node.members ?? [];
    const body: string =
      members.length === 0
        ? "{}"
        : `{\n${this.indent(this.printMemberList(members))}\n}`;
    return [decorators, `${header} ${body}`].filter(Boolean).join("\n");
  }

  private printFunctionDeclaration(node: Node): string {
    const decorators: string = this.printDecorators(node.modifiers);
    const modifiers: string = this.printModifierKeywords(node.modifiers);
    const prefix: string = modifiers ? `${modifiers} ` : "";
    const name: string =
      node.name === undefined ? "" : this.printName(node.name);
    const signature: string = `${prefix}function ${
      node.asteriskToken ? "*" : ""
    }${name}${this.printTypeParameters(node.typeParameters)}(${this.printParameters(
      node.parameters,
    )})${this.printReturnType(node.type)}`;
    const body: string =
      node.body === undefined ? ";" : ` ${this.printBlock(node.body)}`;
    return [decorators, `${signature}${body}`].filter(Boolean).join("\n");
  }

  private printMethodDeclaration(node: Node): string {
    const decorators: string = this.printDecorators(node.modifiers);
    const modifiers: string = this.printModifierKeywords(node.modifiers);
    const prefix: string = modifiers ? `${modifiers} ` : "";
    const signature: string = `${prefix}${
      node.asteriskToken ? "*" : ""
    }${this.printName(node.name!)}${
      node.questionToken ? "?" : ""
    }${this.printTypeParameters(node.typeParameters)}(${this.printParameters(
      node.parameters,
    )})${this.printReturnType(node.type)}`;
    const body: string =
      node.body === undefined ? ";" : ` ${this.printBlock(node.body)}`;
    return [decorators, `${signature}${body}`].filter(Boolean).join("\n");
  }

  private printTypeAliasDeclaration(node: Node): string {
    return `${this.printModifierPrefix(node.modifiers)}type ${this.printName(
      node.name!,
    )}${this.printTypeParameters(node.typeParameters)} = ${this.printType(
      node.type,
    )};`;
  }

  private printIfStatement(node: Node): string {
    const elseText: string =
      node.elseStatement === undefined
        ? ""
        : ` else ${this.printStatementBody(node.elseStatement)}`;
    return `if (${this.printExpression(node.expression)}) ${this.printStatementBody(
      node.thenStatement!,
    )}${elseText}`;
  }

  private printForOfStatement(node: Node): string {
    const awaitText: string = node.awaitModifier ? "await " : "";
    return `for ${awaitText}(${this.printForInitializer(
      node.initializer!,
    )} of ${this.printExpression(node.expression)}) ${this.printStatementBody(
      node.statement!,
    )}`;
  }

  private printTryStatement(node: Node): string {
    const catchText: string =
      node.catchClause === undefined
        ? ""
        : ` ${this.printCatchClause(node.catchClause)}`;
    const finallyText: string =
      node.finallyBlock === undefined
        ? ""
        : ` finally ${this.printBlock(node.finallyBlock)}`;
    return `try ${this.printBlock(node.tryBlock!)}${catchText}${finallyText}`;
  }

  private printCatchClause(node: Node): string {
    const variable: string =
      node.variableDeclaration === undefined
        ? ""
        : ` (${this.printVariableDeclaration(node.variableDeclaration)})`;
    return `catch${variable} ${this.printBlock(node.block as Node)}`;
  }

  private printStatementBody(node: Node): string {
    if (node.kind === SyntaxKind.Block) return this.printBlock(node);
    return `{\n${this.indent(
      this.printWithLeadingComments(node, () => this.printStatement(node)),
    )}\n}`;
  }

  private printBlock(node: Node): string {
    const statements = node.statements ?? [];
    if (statements.length === 0) return "{}";
    return `{\n${this.indent(this.printStatementList(statements))}\n}`;
  }

  private printForInitializer(node: Node): string {
    return node.kind === SyntaxKind.VariableDeclarationList
      ? this.printVariableDeclarationList(node)
      : this.printExpression(node);
  }

  private printVariableDeclarationList(node: Node): string {
    const keyword: string =
      node.flags & NodeFlags.Const
        ? "const"
        : node.flags & NodeFlags.Let
          ? "let"
          : "var";
    return `${keyword} ${(node.declarations ?? [])
      .map((decl) => this.printVariableDeclaration(decl))
      .join(", ")}`;
  }

  private printVariableDeclaration(node: Node): string {
    return [
      this.printBindingName(node.name!),
      node.type === undefined ? "" : `: ${this.printType(node.type)}`,
      node.initializer === undefined
        ? ""
        : ` = ${this.printExpression(node.initializer)}`,
    ].join("");
  }

  private printExpression(node: Node | undefined): string {
    if (node === undefined) return "";
    switch (node.kind) {
      case SyntaxKind.Identifier:
        return node.text ?? node.escapedText ?? "";
      case SyntaxKind.StringLiteral:
        return this.printStringLiteral(node);
      case SyntaxKind.NumericLiteral:
        return String(node.text);
      case SyntaxKind.BigIntLiteral:
        return `${node.text}n`;
      case SyntaxKind.TrueKeyword:
        return "true";
      case SyntaxKind.FalseKeyword:
        return "false";
      case SyntaxKind.NullKeyword:
        return "null";
      case SyntaxKind.PropertyAccessExpression:
        return `${this.printExpression(node.expression)}${
          node.questionDotToken ? "?." : "."
        }${this.printName(node.name!)}`;
      case SyntaxKind.CallExpression:
        return `${this.printExpression(node.expression)}${
          node.questionDotToken ? "?." : ""
        }${this.printTypeArguments(node.typeArguments)}(${(node.arguments ?? [])
          .map((arg) => this.printExpression(arg))
          .join(", ")})`;
      case SyntaxKind.NewExpression:
        return `new ${this.printExpression(node.expression)}${this.printTypeArguments(
          node.typeArguments,
        )}(${(node.arguments ?? [])
          .map((arg) => this.printExpression(arg))
          .join(", ")})`;
      case SyntaxKind.ArrayLiteralExpression:
        return this.printArrayLiteral(node);
      case SyntaxKind.ObjectLiteralExpression:
        return this.printObjectLiteral(node);
      case SyntaxKind.PropertyAssignment:
        return `${this.printName(node.name!)}: ${this.printExpression(
          node.initializer,
        )}`;
      case SyntaxKind.ShorthandPropertyAssignment:
        return node.objectAssignmentInitializer === undefined
          ? this.printName(node.name!)
          : `${this.printName(node.name!)} = ${this.printExpression(
              node.objectAssignmentInitializer,
            )}`;
      case SyntaxKind.SpreadAssignment:
        return `...${this.printExpression(node.expression)}`;
      case SyntaxKind.AwaitExpression:
        return `await ${this.printExpression(node.expression)}`;
      case SyntaxKind.AsExpression:
        return `${this.printExpression(node.expression)} as ${this.printType(
          node.type,
        )}`;
      case SyntaxKind.ConditionalExpression:
        return `${this.printExpression(node.condition)} ? ${this.printExpression(
          node.whenTrue,
        )} : ${this.printExpression(node.whenFalse)}`;
      case SyntaxKind.BinaryExpression:
        return `${this.printExpression(node.left)} ${this.printToken(
          node.operatorToken,
        )} ${this.printExpression(node.right)}`;
      case SyntaxKind.PrefixUnaryExpression:
        return `${this.printToken(node.operator as number)}${this.printExpression(
          node.operand,
        )}`;
      case SyntaxKind.ArrowFunction:
        return `${this.printModifierKeywords(node.modifiers)}${
          node.modifiers?.length ? " " : ""
        }(${this.printParameters(node.parameters)})${this.printReturnType(
          node.type,
        )} => ${this.printArrowBody(node.body!)}`;
      case SyntaxKind.TemplateExpression:
        return this.printTemplateExpression(node);
      default:
        return this.printType(node);
    }
  }

  private printArrayLiteral(node: Node): string {
    const elements: string[] = (node.elements ?? []).map((elem) =>
      this.printExpression(elem),
    );
    if (elements.length === 0) return "[]";
    if (!node.multiLine) return `[${elements.join(", ")}]`;
    return `[\n${this.indent(elements.join(",\n"))},\n]`;
  }

  private printObjectLiteral(node: Node): string {
    const properties: string[] = (node.properties ?? []).map((property) =>
      this.printWithLeadingComments(property, () =>
        this.printExpression(property),
      ),
    );
    if (properties.length === 0) return "{}";
    if (!node.multiLine && properties.length === 1)
      return `{ ${properties[0]} }`;
    return `{\n${this.indent(properties.join(",\n"))},\n}`;
  }

  private printArrowBody(node: Node): string {
    return node.kind === SyntaxKind.Block
      ? this.printBlock(node)
      : this.printExpression(node);
  }

  private printTemplateExpression(node: Node): string {
    return `\`${this.printTemplateText(node.head!)}${(node.templateSpans ?? [])
      .map(
        (span) =>
          `\${${this.printExpression(span.expression)}}${this.printTemplateText(
            span.literal!,
          )}`,
      )
      .join("")}\``;
  }

  private printType(node: Node | undefined): string {
    if (node === undefined) return "";
    switch (node.kind) {
      case SyntaxKind.AnyKeyword:
      case SyntaxKind.BigIntKeyword:
      case SyntaxKind.BooleanKeyword:
      case SyntaxKind.NumberKeyword:
      case SyntaxKind.StringKeyword:
      case SyntaxKind.VoidKeyword:
      case SyntaxKind.KeyOfKeyword:
      case SyntaxKind.UniqueKeyword:
        return this.printToken(node.kind);
      case SyntaxKind.Identifier:
      case SyntaxKind.QualifiedName:
        return this.printName(node);
      case SyntaxKind.StringLiteral:
      case SyntaxKind.NumericLiteral:
      case SyntaxKind.BigIntLiteral:
      case SyntaxKind.TrueKeyword:
      case SyntaxKind.FalseKeyword:
      case SyntaxKind.NullKeyword:
      case SyntaxKind.PrefixUnaryExpression:
        return this.printExpression(node);
      case SyntaxKind.TypeReference:
        return `${this.printName(node.typeName!)}${this.printTypeArguments(
          node.typeArguments,
        )}`;
      case SyntaxKind.TypeQuery:
        return `typeof ${this.printName(node.exprName!)}`;
      case SyntaxKind.TypeLiteral:
        return this.printTypeLiteral(node);
      case SyntaxKind.ArrayType:
        return `${this.wrapArrayElementType(node.elementType!)}[]`;
      case SyntaxKind.ParenthesizedType:
        return `(${this.printType(node.type)})`;
      case SyntaxKind.TupleType:
        return `[${(node.elements ?? [])
          .map((elem) => this.printType(elem))
          .join(", ")}]`;
      case SyntaxKind.UnionType:
        return (node.types ?? [])
          .map((elem) => this.printType(elem))
          .join(" | ");
      case SyntaxKind.IntersectionType:
        return (node.types ?? [])
          .map((elem) => this.wrapIntersectionType(elem))
          .join(" & ");
      case SyntaxKind.LiteralType:
        return this.printExpression(node.literal);
      case SyntaxKind.RestType:
        return `...${this.printType(node.type)}`;
      case SyntaxKind.OptionalType:
        return `${this.printType(node.type)}?`;
      case SyntaxKind.FunctionType:
        return `${this.printTypeParameters(node.typeParameters)}(${this.printParameters(
          node.parameters,
        )}) => ${this.printType(node.type)}`;
      case SyntaxKind.TemplateLiteralType:
        return this.printTemplateLiteralType(node);
      default:
        return this.printExpression(node);
    }
  }

  private printTypeLiteral(node: Node): string {
    const members = node.members ?? [];
    if (members.length === 0) return "{}";
    return `{\n${this.indent(this.printMemberList(members))}\n}`;
  }

  private printTypeMember(node: Node): string {
    switch (node.kind) {
      case SyntaxKind.PropertySignature:
        return `${this.printModifierPrefix(node.modifiers)}${this.printName(
          node.name!,
        )}${node.questionToken ? "?" : ""}${
          node.type === undefined ? "" : `: ${this.printType(node.type)}`
        };`;
      case SyntaxKind.IndexSignature:
        return `${this.printModifierPrefix(node.modifiers)}[${this.printParameters(
          node.parameters,
        )}]: ${this.printType(node.type)};`;
      default:
        return this.printType(node);
    }
  }

  private printTemplateLiteralType(node: Node): string {
    return `\`${this.printTemplateText(node.head!)}${(node.templateSpans ?? [])
      .map(
        (span) =>
          `\${${this.printType(span.type)}}${this.printTemplateText(
            span.literal!,
          )}`,
      )
      .join("")}\``;
  }

  private wrapArrayElementType(node: Node): string {
    return node.kind === SyntaxKind.UnionType ||
      node.kind === SyntaxKind.IntersectionType
      ? `(${this.printType(node)})`
      : this.printType(node);
  }

  private wrapIntersectionType(node: Node): string {
    return node.kind === SyntaxKind.UnionType
      ? `(${this.printType(node)})`
      : this.printType(node);
  }

  private printParameters(parameters: readonly Node[] | undefined): string {
    return (parameters ?? [])
      .map((param) => this.printParameter(param))
      .join(", ");
  }

  private printParameter(node: Node): string {
    return [
      this.printInlineDecorators(node.modifiers),
      this.printModifierPrefix(node.modifiers),
      node.dotDotDotToken ? "..." : "",
      this.printBindingName(node.name!),
      node.questionToken ? "?" : "",
      node.type === undefined ? "" : `: ${this.printType(node.type)}`,
      node.initializer === undefined
        ? ""
        : ` = ${this.printExpression(node.initializer)}`,
    ].join("");
  }

  private printBindingName(node: Node): string {
    if (node.kind === SyntaxKind.ArrayBindingPattern)
      return `[${(node.elements ?? [])
        .map((elem) => this.printBindingElement(elem))
        .join(", ")}]`;
    return this.printName(node);
  }

  private printBindingElement(node: Node): string {
    return [
      node.dotDotDotToken ? "..." : "",
      node.propertyName === undefined
        ? ""
        : `${this.printName(node.propertyName)}: `,
      this.printBindingName(node.name!),
      node.initializer === undefined
        ? ""
        : ` = ${this.printExpression(node.initializer)}`,
    ].join("");
  }

  private printName(node: Node): string {
    if (node.kind === SyntaxKind.Identifier)
      return node.text ?? node.escapedText ?? "";
    if (node.kind === SyntaxKind.StringLiteral)
      return this.printStringLiteral(node);
    if (node.kind === SyntaxKind.QualifiedName)
      return `${this.printName(node.left!)}.${this.printName(node.right!)}`;
    return this.printExpression(node);
  }

  private printTypeParameters(
    typeParameters: readonly Node[] | undefined,
  ): string {
    return typeParameters?.length
      ? `<${typeParameters.map((param) => this.printType(param)).join(", ")}>`
      : "";
  }

  private printTypeArguments(
    typeArguments: readonly Node[] | undefined,
  ): string {
    return typeArguments?.length
      ? `<${typeArguments.map((param) => this.printType(param)).join(", ")}>`
      : "";
  }

  private printReturnType(type: Node | undefined): string {
    return type === undefined ? "" : `: ${this.printType(type)}`;
  }

  private printModifierPrefix(modifiers: readonly Node[] | undefined): string {
    const text: string = this.printModifierKeywords(modifiers);
    return text ? `${text} ` : "";
  }

  private printModifierKeywords(
    modifiers: readonly Node[] | undefined,
  ): string {
    return (modifiers ?? [])
      .filter((modifier) => modifier.kind !== SyntaxKind.Decorator)
      .map((modifier) => this.printToken(modifier.kind))
      .filter(Boolean)
      .join(" ");
  }

  private printDecorators(modifiers: readonly Node[] | undefined): string {
    return (modifiers ?? [])
      .filter((modifier) => modifier.kind === SyntaxKind.Decorator)
      .map((decorator) => `@${this.printExpression(decorator.expression)}`)
      .join("\n");
  }

  private printInlineDecorators(
    modifiers: readonly Node[] | undefined,
  ): string {
    const text: string = (modifiers ?? [])
      .filter((modifier) => modifier.kind === SyntaxKind.Decorator)
      .map((decorator) => `@${this.printExpression(decorator.expression)}`)
      .join(" ");
    return text ? `${text} ` : "";
  }

  private printAny(node: Node): string {
    if (this.isNewLine(node)) return "";
    switch (node.kind) {
      case SyntaxKind.PropertySignature:
      case SyntaxKind.IndexSignature:
        return this.printTypeMember(node);
      case SyntaxKind.SourceFile:
      case SyntaxKind.ImportDeclaration:
      case SyntaxKind.ExportDeclaration:
      case SyntaxKind.ModuleDeclaration:
      case SyntaxKind.ClassDeclaration:
      case SyntaxKind.FunctionDeclaration:
      case SyntaxKind.TypeAliasDeclaration:
      case SyntaxKind.VariableStatement:
      case SyntaxKind.ExpressionStatement:
      case SyntaxKind.ReturnStatement:
      case SyntaxKind.IfStatement:
      case SyntaxKind.ForOfStatement:
      case SyntaxKind.ContinueStatement:
      case SyntaxKind.ThrowStatement:
      case SyntaxKind.TryStatement:
      case SyntaxKind.Block:
        return this.printStatement(node);
      default:
        return this.printExpression(node);
    }
  }

  private printTemplateText(node: Node): string {
    return node.rawText ?? node.text ?? "";
  }

  private printStringLiteral(node: Node): string {
    return JSON.stringify(node.text ?? "");
  }

  private isNewLine(node: Node): boolean {
    return node.kind === SyntaxKind.Identifier && node.text === "\n";
  }

  private printToken(token: number | Node | undefined): string {
    const kind: number | undefined =
      typeof token === "number" ? token : token?.kind;
    switch (kind) {
      case SyntaxKind.DotDotDotToken:
        return "...";
      case SyntaxKind.QuestionDotToken:
        return "?.";
      case SyntaxKind.EqualsEqualsEqualsToken:
        return "===";
      case SyntaxKind.EqualsGreaterThanToken:
        return "=>";
      case SyntaxKind.MinusToken:
        return "-";
      case SyntaxKind.ExclamationToken:
        return "!";
      case SyntaxKind.QuestionToken:
        return "?";
      case SyntaxKind.ColonToken:
        return ":";
      case SyntaxKind.QuestionQuestionToken:
        return "??";
      case SyntaxKind.EqualsToken:
        return "=";
      case SyntaxKind.QuestionQuestionEqualsToken:
        return "??=";
      case SyntaxKind.ExportKeyword:
        return "export";
      case SyntaxKind.AsyncKeyword:
        return "async";
      case SyntaxKind.PublicKeyword:
        return "public";
      case SyntaxKind.ReadonlyKeyword:
        return "readonly";
      case SyntaxKind.AnyKeyword:
        return "any";
      case SyntaxKind.BigIntKeyword:
        return "bigint";
      case SyntaxKind.BooleanKeyword:
        return "boolean";
      case SyntaxKind.NumberKeyword:
        return "number";
      case SyntaxKind.StringKeyword:
        return "string";
      case SyntaxKind.VoidKeyword:
        return "void";
      case SyntaxKind.KeyOfKeyword:
        return "keyof";
      case SyntaxKind.UniqueKeyword:
        return "unique";
      default:
        return "";
    }
  }

  private indent(text: string): string {
    return text
      .split("\n")
      .map((line) => (line.length ? `  ${line}` : line))
      .join("\n");
  }
}
