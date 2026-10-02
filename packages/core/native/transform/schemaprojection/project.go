package schemaprojection

import metadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"

// Project gives the schema writer an isolated representation
// of an absorbed metadata graph. Recursive tuples occupy named alias slots
// so the writer registers their component before visiting its children. Arrays
// retain their native recursive representation and every name remains the
// identifier allocated by the original metadata collection.
//
// The returned graph shares read-only scalar annotations but no metadata or
// component node whose traversal or name cache the writer can mutate. The raw
// graph remains the source of reflected interop data. Callers must use the
// returned root for both the main schema and decomposed property schemas.
// This type-only metadata foundation lives in the stable core host module:
// contributor packages are relocated by ttsc, while their host imports keep
// this module identity. The SDK owns baking and calls this operation across
// that production boundary; this package has no SDK module dependency.
//
// @evidence contracts/common.md#principled-implementation SDK analysis absorbs aliases, while the schema writer only breaks tuple cycles through named alias components. Replacing recursive tuple uses by aliases of the same collection-allocated semantic slot retains tuple elements and recursive edges without creating names or changing raw reflection. Memoized copies are registered before visiting edges, preserving shared and mutually recursive identities.
// @evidence contracts/common.md#clear-and-simple-design One graph projection owns the writer representation; a private visitor copies metadata and component edges, and one tuple helper separates a named use from its inline component body.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The mapping follows recursive tuple metadata and original collection names for every input. It does not mutate foreign implementations, change absorption options, recognize fixture names, or catch schema failures.
// @evidence contracts/common.md#meaningful-documentation The comment explains absorbed input, recursive tuple representation, original name ownership, isolation and the requirement to share the returned root with property schema generation.
// @evidence contracts/performance.md#efficient-algorithms Pointer maps visit each metadata and component once, and copy each outgoing edge once, for O(V+E+annotation payload) work and space. The projection adds no checker analysis, compiler or host operation.
// @evidence contracts/performance.md#reuse-equivalent-work Pointer memoization reuses each original metadata and component's projection when several edges reach the same identity within this invocation. The immutable supplied graph establishes equivalence, and the caller reuses that one returned graph for root and property schema writes against shared components. Each different invocation owns fresh maps and does not reuse a projection across changed inputs.
// @evidence contracts/performance.md#bound-retention-and-release-resources Memo maps and copied nodes belong to one bake invocation and become reclaimable with its result; no global cache, handle or background work is retained.
// @evidenceExclude contracts/portability.md#os-neutral-implementation The projection visits an in-memory typia metadata graph with no native file identity or subprocess boundary.
func Project(input *metadata.MetadataSchema) *metadata.MetadataSchema {
	projection := &projection{
		metadatas:    map[*metadata.MetadataSchema]*metadata.MetadataSchema{},
		arrays:       map[*metadata.MetadataArrayType]*metadata.MetadataArrayType{},
		tuples:       map[*metadata.MetadataTupleType]*metadata.MetadataTupleType{},
		objects:      map[*metadata.MetadataObjectType]*metadata.MetadataObjectType{},
		aliases:      map[*metadata.MetadataAliasType]*metadata.MetadataAliasType{},
		tupleAliases: map[*metadata.MetadataTupleType]*metadata.MetadataAliasType{},
	}
	return projection.visit(input)
}

// projection retains invocation-local graph identities, including
// separate tuple component bodies and their named recursive use sites.
type projection struct {
	metadatas    map[*metadata.MetadataSchema]*metadata.MetadataSchema
	arrays       map[*metadata.MetadataArrayType]*metadata.MetadataArrayType
	tuples       map[*metadata.MetadataTupleType]*metadata.MetadataTupleType
	objects      map[*metadata.MetadataObjectType]*metadata.MetadataObjectType
	aliases      map[*metadata.MetadataAliasType]*metadata.MetadataAliasType
	tupleAliases map[*metadata.MetadataTupleType]*metadata.MetadataAliasType
}

// visit copies every metadata edge before a writer can reach it. Shared scalar
// tag and documentation payloads are read-only to the schema writer.
func (p *projection) visit(input *metadata.MetadataSchema) *metadata.MetadataSchema {
	if input == nil {
		return nil
	}
	if output, ok := p.metadatas[input]; ok {
		return output
	}
	output := input.ShallowClone()
	p.metadatas[input] = output
	output.Rest = p.visit(input.Rest)
	if input.Escaped != nil {
		copy := *input.Escaped
		output.Escaped = &copy
		copy.Original, copy.Returns = p.visit(input.Escaped.Original), p.visit(input.Escaped.Returns)
	}
	output.Atomics = copyLeaves(input.Atomics)
	output.Constants = copyLeaves(input.Constants)
	output.Natives = copyLeaves(input.Natives)
	output.Templates = copyLeaves(input.Templates)
	for i, entry := range input.Templates {
		if entry == nil {
			continue
		}
		output.Templates[i].Row = make([]*metadata.MetadataSchema, len(entry.Row))
		for j, child := range entry.Row {
			output.Templates[i].Row[j] = p.visit(child)
		}
	}
	output.Functions = copyLeaves(input.Functions)
	for i, entry := range input.Functions {
		if entry == nil {
			continue
		}
		copy := output.Functions[i]
		copy.Output = p.visit(entry.Output)
		copy.Parameters = copyLeaves(entry.Parameters)
		for j, parameter := range entry.Parameters {
			if parameter != nil {
				copy.Parameters[j].Type = p.visit(parameter.Type)
			}
		}
	}
	output.Sets = copyLeaves(input.Sets)
	for i, entry := range input.Sets {
		if entry != nil {
			output.Sets[i].Value = p.visit(entry.Value)
		}
	}
	output.Maps = copyLeaves(input.Maps)
	for i, entry := range input.Maps {
		if entry != nil {
			output.Maps[i].Key, output.Maps[i].Value = p.visit(entry.Key), p.visit(entry.Value)
		}
	}
	output.Arrays = copyLeaves(input.Arrays)
	for i, entry := range input.Arrays {
		if entry == nil || entry.Type == nil {
			continue
		}
		component, ok := p.arrays[entry.Type]
		if !ok {
			copy := *entry.Type
			component = &copy
			p.arrays[entry.Type] = component
			component.Value = p.visit(entry.Type.Value)
		}
		output.Arrays[i].Type = component
	}
	output.Objects = copyLeaves(input.Objects)
	for i, entry := range input.Objects {
		if entry == nil || entry.Type == nil {
			continue
		}
		component, ok := p.objects[entry.Type]
		if !ok {
			copy := *entry.Type
			component = &copy
			p.objects[entry.Type] = component
			component.Properties = copyLeaves(entry.Type.Properties)
			for j, property := range entry.Type.Properties {
				if property != nil {
					component.Properties[j].Key, component.Properties[j].Value = p.visit(property.Key), p.visit(property.Value)
				}
			}
		}
		output.Objects[i].Type = component
	}
	output.Aliases = copyLeaves(input.Aliases)
	for i, entry := range input.Aliases {
		if entry == nil || entry.Type == nil {
			continue
		}
		component, ok := p.aliases[entry.Type]
		if !ok {
			copy := *entry.Type
			component = &copy
			p.aliases[entry.Type] = component
			component.Value = p.visit(entry.Type.Value)
		}
		output.Aliases[i].Type = component
	}
	output.Tuples = make([]*metadata.MetadataTuple, 0, len(input.Tuples))
	for _, entry := range input.Tuples {
		if entry == nil || entry.Type == nil {
			output.Tuples = append(output.Tuples, entry)
			continue
		}
		if entry.Type.Recursive {
			alias, ok := p.tupleAliases[entry.Type]
			if !ok {
				alias = metadata.MetadataAliasType_create(metadata.MetadataAliasType{
					Name: entry.Type.Name, DisplayName: entry.Type.DisplayName, Recursive: true, Nullables: entry.Type.Nullables,
				})
				p.tupleAliases[entry.Type] = alias
				body := metadata.MetadataSchema_initialize()
				alias.Value = body
				copy := *entry
				copy.Type = p.tuple(entry.Type)
				body.Tuples = []*metadata.MetadataTuple{&copy}
			}
			output.Aliases = append(output.Aliases, metadata.MetadataAlias_create(metadata.MetadataAlias{Type: alias, Tags: entry.Tags}))
		} else {
			copy := *entry
			copy.Type = p.tuple(entry.Type)
			output.Tuples = append(output.Tuples, &copy)
		}
	}
	return output
}

// tuple copies a structural component after registering its identity, allowing
// its child metadata to return through the already registered named alias.
func (p *projection) tuple(input *metadata.MetadataTupleType) *metadata.MetadataTupleType {
	if output, ok := p.tuples[input]; ok {
		return output
	}
	copy := *input
	output := &copy
	p.tuples[input] = output
	output.Elements = make([]*metadata.MetadataSchema, len(input.Elements))
	for i, element := range input.Elements {
		output.Elements[i] = p.visit(element)
	}
	return output
}

// copyLeaves isolates node-local name caches. Scalar annotation
// slices remain shared because the public schema writer only reads them.
func copyLeaves[T any](input []*T) []*T {
	if input == nil {
		return nil
	}
	output := make([]*T, len(input))
	for i, item := range input {
		if item != nil {
			copy := *item
			output[i] = &copy
		}
	}
	return output
}
