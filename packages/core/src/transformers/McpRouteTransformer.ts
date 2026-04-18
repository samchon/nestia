import path from "path";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";
import { McpRouteProgrammer } from "../programmers/McpRouteProgrammer";

export namespace McpRouteTransformer {
	export const transform = (props: {
		context: INestiaTransformContext;
		decorator: ts.Decorator;
		method: ts.MethodDeclaration;
	}): ts.Decorator => {
		// 1. Must be a call expression: @McpRoute(...)
		if (!ts.isCallExpression(props.decorator.expression))
			return props.decorator;

		// 2. Check it's THIS project's McpRoute (not some other lib's)
		const signature = props.context.checker.getResolvedSignature(
			props.decorator.expression,
		);
		if (!signature?.declaration) return props.decorator;

		const location = path.resolve(
			signature.declaration.getSourceFile().fileName,
		);
		if (LIB_PATHS.every((str) => location.indexOf(str) === -1))
			return props.decorator;

		// 3. Already transformed? (2+ args means second run — skip)
		if (props.decorator.expression.arguments.length >= 2)
			return props.decorator;

		// 4. Find the @McpRoute.Params<T>() parameter to extract its type
		const paramsType = findParamsType(props);
		if (!paramsType) return props.decorator; // no Params decorator = no schema to inject

		// 5. Generate JSON Schema, inject as second decorator arg
		return ts.factory.createDecorator(
			ts.factory.updateCallExpression(
				props.decorator.expression,
				props.decorator.expression.expression,
				props.decorator.expression.typeArguments,
				[
					...props.decorator.expression.arguments,
					McpRouteProgrammer.generate({
						context: props.context,
						modulo: props.decorator.expression.expression,
						type: paramsType,
					}),
				],
			),
		);
	};

	const findParamsType = (props: {
		context: INestiaTransformContext;
		method: ts.MethodDeclaration;
	}): ts.Type | undefined => {
		for (const param of props.method.parameters) {
			const decos = (param.modifiers ?? []).filter((m) =>
				ts.isDecorator(m),
			) as ts.Decorator[];
			const match = decos.some((d) =>
				d.expression.getText().includes("McpRoute.Params"),
			);
			if (match) return props.context.checker.getTypeAtLocation(param);
		}
		return undefined;
	};
}

const LIB_PATHS = [
	path.join("@nestia", "core", "lib", "decorators", "McpRoute.d.ts"),
	path.join("packages", "core", "src", "decorators", "McpRoute.ts"),
];
