package sdk

import (
	"math"
	"reflect"

	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

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
				"value":       nestiaSDKMetadataConstantValue(value.Value),
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
	value, encoding := nestiaSDKMetadataValue(tag.Value)
	output := map[string]any{
		"target":    tag.Target,
		"name":      tag.Name,
		"kind":      tag.Kind,
		"exclusive": tag.Exclusive,
		"value":     value,
		"schema":    tag.Schema,
	}
	// A tag's target is the type it tags, not its value's: `tags.Sequence<1>`
	// on a bigint holds a number, `tags.Example<"Infinity">` on a number a
	// string. So an encoded value names the type it stands for.
	if encoding != "" {
		output["encoding"] = encoding
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

// nestiaSDKMetadataConstantValue writes a constant's value for the metadata
// literal. The constant's type is its value's own, so a string the value is
// encoded as is read back by that type.
func nestiaSDKMetadataConstantValue(input any) any {
	value, _ := nestiaSDKMetadataValue(input)
	return value
}

// nestiaSDKMetadataValue writes a constant's or a type tag's value for the
// metadata literal, keeping what a JSON number cannot hold, and returns the
// type an encoded value stands for.
//
// The SDK generator reads these values to write types back, the literal type
// `5n` or the tag `tags.Minimum<1e999>` of a cloned DTO, so a lossy value
// becomes a wrong or uncompilable type. typia marshals a bigint as a bare JSON
// number, which the generator's `JSON.parse` rounds past 2^53, and JSON has no
// NaN or ±Infinity at all. So a bigint is written as its decimal digits and a
// non-finite number by its JavaScript name (`"NaN"`, `"Infinity"`,
// `"-Infinity"`), as strings the generator reads back as `"bigint"` or
// `"number"`.
//
// Only the value itself is encoded. A composite one, such as the object
// `tags.Examples` or `tags.JsonSchemaPlugin` takes, may hold any string, so
// an encoded member could not be told apart; its members keep what a JSON
// document holds, as the tag's `schema` and the baked JSON schemas do
// (nestiaSDKFiniteLiteral).
func nestiaSDKMetadataValue(input any) (any, string) {
	switch value := input.(type) {
	case schemametadata.MetadataBigint:
		return nestiaSDKBigintText(value), "bigint"
	case *schemametadata.MetadataBigint:
		if value != nil {
			return nestiaSDKBigintText(*value), "bigint"
		}
		return input, ""
	}
	reflected := reflect.ValueOf(input)
	if reflected.Kind() != reflect.Float32 && reflected.Kind() != reflect.Float64 {
		return input, ""
	}
	number := reflected.Float()
	if math.IsNaN(number) {
		return "NaN", "number"
	} else if math.IsInf(number, 1) {
		return "Infinity", "number"
	} else if math.IsInf(number, -1) {
		return "-Infinity", "number"
	}
	return input, ""
}

func nestiaSDKBigintText(value schemametadata.MetadataBigint) string {
	if value.Text == "" {
		return "0"
	}
	return value.Text
}
