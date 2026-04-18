import {
	JsonSchemaProgrammer,
	MetadataCollection,
	MetadataFactory,
	MetadataSchema,
	TransformerError,
} from "@typia/core";
import { ValidationPipe } from "@typia/interface";
import ts from "typescript";

import { INestiaTransformContext } from "../options/INestiaTransformProject";

export namespace McpRouteProgrammer {
	export const generate = (props: {
		context: INestiaTransformContext;
		modulo: ts.LeftHandSideExpression;
		type: ts.Type;
	}): ts.Expression => {
		const result: ValidationPipe<MetadataSchema, MetadataFactory.IError> =
			MetadataFactory.analyze({
				checker: props.context.checker,
				transformer: props.context.transformer,
				options: {
					escape: true,
					constant: true,
					absorb: true,
				},
				components: new MetadataCollection(),
				type: props.type,
			});
		if (result.success === false)
			throw TransformerError.from({
				code: "@nestia.core.McpRoute",
				errors: result.errors,
			});
		return JsonSchemaProgrammer.write({
			context: {
				...props.context,
				options: {
					numeric: false,
					finite: false,
					functional: false,
				},
			},
			version: "3.1",
			metadata: result.data,
		});
	};
}
