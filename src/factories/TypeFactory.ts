import ts from "typescript";

export namespace TypeFactory {
    export function escape(
        checker: ts.TypeChecker,
        type: ts.Type,
    ): [ts.Type, boolean] {
        const converted: ts.Type | null = get_return_type(
            checker,
            type,
            "toJSON",
        );
        return [converted || type, !!converted];
    }

    export function is_function(node: ts.Node): boolean {
        return get_function(node) !== null;
    }

    function get_function(node: ts.Node): ts.SignatureDeclaration | null {
        return ts.isFunctionLike(node)
            ? node
            : ts.isPropertyAssignment(node) || ts.isPropertyDeclaration(node)
            ? ts.isFunctionLike(node.initializer)
                ? node.initializer
                : null
            : null;
    }

    function get_return_type(
        checker: ts.TypeChecker,
        type: ts.Type,
        name: string,
    ): ts.Type | null {
        // FIND TO-JSON METHOD
        const symbol: ts.Symbol | undefined = type.getProperty(name);
        if (!symbol) return null;
        else if (!symbol.declarations || !symbol.declarations[0]) return null;

        // GET FUNCTION DECLARATION
        const declaration: ts.Declaration = symbol.declarations[0];
        const functor: ts.SignatureDeclaration | null =
            get_function(declaration);

        if (functor === null) return null;

        // RETURNS THE RETURN-TYPE
        const signature: ts.Signature | undefined =
            checker.getSignatureFromDeclaration(functor);
        return signature ? signature.getReturnType() : null;
    }

    export function full_name(checker: ts.TypeChecker, type: ts.Type): string {
        // PRIMITIVE
        const symbol: ts.Symbol | undefined =
            type.aliasSymbol || type.getSymbol();
        if (symbol === undefined)
            return checker.typeToString(type, undefined, undefined);
        // UNION OR INTERSECT
        else if (
            type.aliasSymbol === undefined &&
            type.isUnionOrIntersection()
        ) {
            const joiner: string = type.isIntersection() ? " & " : " | ";
            return type.types
                .map((child) => full_name(checker, child))
                .join(joiner);
        }

        //----
        // SPECIALIZATION
        //----
        const name: string = get_name(symbol);

        // CHECK GENERIC
        const generic: readonly ts.Type[] = checker.getTypeArguments(
            type as ts.TypeReference,
        );
        return generic.length
            ? name === "Promise"
                ? full_name(checker, generic[0]!)
                : `${name}<${generic
                      .map((child) => full_name(checker, child))
                      .join(", ")}>`
            : name;
    }

    function explore_name(name: string, decl: ts.Node): string {
        return ts.isModuleBlock(decl)
            ? explore_name(
                  `${decl.parent.name.getText()}.${name}`,
                  decl.parent.parent,
              )
            : name;
    }

    function get_name(symbol: ts.Symbol): string {
        return explore_name(
            symbol.escapedName.toString(),
            symbol.getDeclarations()![0]!.parent,
        );
    }
}
