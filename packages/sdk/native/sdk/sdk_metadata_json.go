package sdk

import schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"

func nestiaSDKMetadataComponentsLiteral(
	components schemametadata.IMetadataComponents,
) map[string]any {
	return map[string]any{
		"objects": nestiaSDKMetadataObjectTypes(components.Objects),
		"aliases": nestiaSDKMetadataAliasTypes(components.Aliases),
		"arrays":  nestiaSDKMetadataArrayTypes(components.Arrays),
		"tuples":  nestiaSDKMetadataTupleTypes(components.Tuples),
	}
}

func nestiaSDKMetadataSchemaLiteral(meta *schemametadata.IMetadataSchema) any {
	if meta == nil {
		return nestiaSDKLiteralNull
	}
	return map[string]any{
		"any":       meta.Any,
		"required":  meta.Required,
		"optional":  meta.Optional,
		"nullable":  meta.Nullable,
		"functions": nestiaSDKMetadataFunctions(meta.Functions),
		"atomics":   nestiaSDKMetadataAtomics(meta.Atomics),
		"constants": nestiaSDKMetadataConstants(meta.Constants),
		"templates": nestiaSDKMetadataTemplates(meta.Templates),
		"escaped":   nestiaSDKMetadataEscaped(meta.Escaped),
		"rest":      nestiaSDKMetadataSchemaLiteral(meta.Rest),
		"arrays":    nestiaSDKMetadataReferences(meta.Arrays),
		"tuples":    nestiaSDKMetadataReferences(meta.Tuples),
		"objects":   nestiaSDKMetadataReferences(meta.Objects),
		"aliases":   nestiaSDKMetadataReferences(meta.Aliases),
		"natives":   nestiaSDKMetadataReferences(meta.Natives),
		"sets":      nestiaSDKMetadataSets(meta.Sets),
		"maps":      nestiaSDKMetadataMaps(meta.Maps),
	}
}

func nestiaSDKMetadataFunctions(
	input []*schemametadata.IMetadataSchema_IFunction,
) []any {
	output := []any{}
	for _, fn := range input {
		if fn == nil {
			continue
		}
		output = append(output, map[string]any{
			"parameters": nestiaSDKMetadataParameters(fn.Parameters),
			"output":     nestiaSDKMetadataSchemaLiteral(fn.Output),
			"async":      fn.Async,
		})
	}
	return output
}

func nestiaSDKMetadataParameters(
	input []*schemametadata.IMetadataSchema_IParameter,
) []any {
	output := []any{}
	for _, param := range input {
		if param == nil {
			continue
		}
		output = append(output, map[string]any{
			"name":        param.Name,
			"type":        nestiaSDKMetadataSchemaLiteral(param.Type),
			"description": nestiaSDKOptionalString(param.Description),
			"jsDocTags":   nestiaSDKJSDocTags(param.JsDocTags),
		})
	}
	return output
}

func nestiaSDKMetadataAtomics(
	input []schemametadata.IMetadataSchema_IAtomic,
) []any {
	output := []any{}
	for _, atomic := range input {
		output = append(output, map[string]any{
			"type": atomic.Type,
			"tags": nestiaSDKMetadataTagMatrix(atomic.Tags),
		})
	}
	return output
}

func nestiaSDKMetadataConstants(
	input []schemametadata.IMetadataSchema_IConstant,
) []any {
	output := []any{}
	for _, constant := range input {
		values := []any{}
		for _, value := range constant.Values {
			values = append(values, map[string]any{
				"value":       value.Value,
				"tags":        nestiaSDKMetadataTagMatrix(value.Tags),
				"description": nestiaSDKOptionalString(value.Description),
				"jsDocTags":   nestiaSDKJSDocTags(value.JsDocTags),
			})
		}
		output = append(output, map[string]any{
			"type":   constant.Type,
			"values": values,
		})
	}
	return output
}

func nestiaSDKMetadataTemplates(
	input []schemametadata.IMetadataSchema_ITemplate,
) []any {
	output := []any{}
	for _, template := range input {
		row := []any{}
		for _, child := range template.Row {
			row = append(row, nestiaSDKMetadataSchemaLiteral(child))
		}
		output = append(output, map[string]any{
			"row":  row,
			"tags": nestiaSDKMetadataTagMatrix(template.Tags),
		})
	}
	return output
}

func nestiaSDKMetadataEscaped(
	input *schemametadata.IMetadataSchema_IEscaped,
) any {
	if input == nil {
		return nestiaSDKLiteralNull
	}
	return map[string]any{
		"original": nestiaSDKMetadataSchemaLiteral(input.Original),
		"returns":  nestiaSDKMetadataSchemaLiteral(input.Returns),
	}
}

func nestiaSDKMetadataReferences(
	input []schemametadata.IMetadataSchema_IReference,
) []any {
	output := []any{}
	for _, ref := range input {
		output = append(output, map[string]any{
			"name": ref.Name,
			"tags": nestiaSDKMetadataTagMatrix(ref.Tags),
		})
	}
	return output
}

func nestiaSDKMetadataSets(input []schemametadata.IMetadataSchema_ISet) []any {
	output := []any{}
	for _, set := range input {
		output = append(output, map[string]any{
			"value": nestiaSDKMetadataSchemaLiteral(set.Value),
			"tags":  nestiaSDKMetadataTagMatrix(set.Tags),
		})
	}
	return output
}

func nestiaSDKMetadataMaps(input []schemametadata.IMetadataSchema_IMap) []any {
	output := []any{}
	for _, entry := range input {
		output = append(output, map[string]any{
			"key":   nestiaSDKMetadataSchemaLiteral(entry.Key),
			"value": nestiaSDKMetadataSchemaLiteral(entry.Value),
			"tags":  nestiaSDKMetadataTagMatrix(entry.Tags),
		})
	}
	return output
}

func nestiaSDKMetadataObjectTypes(
	input []schemametadata.IMetadataSchema_IObjectType,
) []any {
	output := []any{}
	for _, object := range input {
		properties := []any{}
		for _, property := range object.Properties {
			if property == nil {
				continue
			}
			properties = append(properties, map[string]any{
				"key":         nestiaSDKMetadataSchemaLiteral(property.Key),
				"value":       nestiaSDKMetadataSchemaLiteral(property.Value),
				"description": nestiaSDKOptionalString(property.Description),
				"jsDocTags":   nestiaSDKJSDocTags(property.JsDocTags),
				"mutability":  nestiaSDKOptionalString(property.Mutability),
			})
		}
		output = append(output, map[string]any{
			"name":        object.Name,
			"properties":  properties,
			"description": nestiaSDKOptionalString(object.Description),
			"jsDocTags":   nestiaSDKJSDocTags(object.JsDocTags),
			"index":       object.Index,
			"recursive":   object.Recursive,
			"nullables":   nestiaSDKBoolArray(object.Nullables),
		})
	}
	return output
}

func nestiaSDKMetadataAliasTypes(
	input []schemametadata.IMetadataSchema_IAliasType,
) []any {
	output := []any{}
	for _, alias := range input {
		output = append(output, map[string]any{
			"name":        alias.Name,
			"value":       nestiaSDKMetadataSchemaLiteral(alias.Value),
			"description": nestiaSDKOptionalString(alias.Description),
			"jsDocTags":   nestiaSDKJSDocTags(alias.JsDocTags),
			"recursive":   alias.Recursive,
			"nullables":   nestiaSDKBoolArray(alias.Nullables),
		})
	}
	return output
}

func nestiaSDKMetadataArrayTypes(
	input []schemametadata.IMetadataSchema_IArrayType,
) []any {
	output := []any{}
	for _, array := range input {
		output = append(output, map[string]any{
			"name":      array.Name,
			"value":     nestiaSDKMetadataSchemaLiteral(array.Value),
			"nullables": nestiaSDKBoolArray(array.Nullables),
			"recursive": array.Recursive,
			"index":     nestiaSDKOptionalInt(array.Index),
		})
	}
	return output
}

func nestiaSDKMetadataTupleTypes(
	input []schemametadata.IMetadataSchema_ITupleType,
) []any {
	output := []any{}
	for _, tuple := range input {
		elements := []any{}
		for _, elem := range tuple.Elements {
			elements = append(elements, nestiaSDKMetadataSchemaLiteral(elem))
		}
		output = append(output, map[string]any{
			"name":      tuple.Name,
			"elements":  elements,
			"index":     nestiaSDKOptionalInt(tuple.Index),
			"recursive": tuple.Recursive,
			"nullables": nestiaSDKBoolArray(tuple.Nullables),
		})
	}
	return output
}

func nestiaSDKMetadataTagMatrix(
	input [][]schemametadata.IMetadataTypeTag,
) []any {
	output := []any{}
	for _, row := range input {
		items := []any{}
		for _, tag := range row {
			items = append(items, nestiaSDKMetadataTypeTag(tag))
		}
		output = append(output, items)
	}
	return output
}

func nestiaSDKMetadataTypeTag(tag schemametadata.IMetadataTypeTag) map[string]any {
	output := map[string]any{
		"target":    tag.Target,
		"name":      tag.Name,
		"kind":      tag.Kind,
		"exclusive": tag.Exclusive,
		"value":     tag.Value,
		"schema":    tag.Schema,
	}
	if tag.Validate != "" {
		output["validate"] = tag.Validate
	}
	return output
}

func nestiaSDKJSDocTags(input []schemametadata.IJsDocTagInfo) []any {
	output := []any{}
	for _, tag := range input {
		text := []any{}
		for _, item := range tag.Text {
			text = append(text, map[string]any{
				"text": item.Text,
				"kind": item.Kind,
			})
		}
		output = append(output, map[string]any{
			"name": tag.Name,
			"text": text,
		})
	}
	return output
}

func nestiaSDKBoolArray(input []bool) []any {
	output := []any{}
	for _, value := range input {
		output = append(output, value)
	}
	return output
}

func nestiaSDKOptionalString(input *string) any {
	if input == nil {
		return nestiaSDKLiteralNull
	}
	return *input
}

func nestiaSDKOptionalInt(input *int) any {
	if input == nil {
		return nestiaSDKLiteralNull
	}
	return *input
}
