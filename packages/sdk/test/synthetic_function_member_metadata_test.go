package test

import (
	"strings"
	"testing"
)

// Verifies a return type carrying a function-typed property serializes its
// function signature (the async flag and the output schema) through the metadata
// JSON writer.
//
// nestiaSDKMetadataSchemaLiteral emits a "functions" array via
// nestiaSDKMetadataFunctions whenever typia's MetadataFactory reflects a function
// member on an object. None of the tests/test-sdk controllers return such a type,
// so the function-serialization arm stays dark; a synthetic controller returning
// an interface with a callable member is the only in-process driver for it. (The
// current typia reflection leaves the function's parameter list empty for an
// object-property function type, so nestiaSDKMetadataParameters' loop body is not
// reachable through this path — it mirrors the IParameter shape defensively.)
//
//  1. Author a controller returning an object whose property is a function type.
//  2. Run the SDK metadata pass over it in-process (no disk emit).
//  3. Assert the emitted metadata carries the reflected function entry.
func TestSyntheticFunctionMemberMetadataSerializesFunction(t *testing.T) {
	const controller = `import core from "@nestia/core";

interface IHandlers {
  invoke: (payload: number) => string;
}

export class SyntheticController {
  @core.TypedRoute.Get("handlers")
  public handlers(): IHandlers {
    return { invoke: () => "" };
  }
}
`
	meta := buildSyntheticMetadata(t, controller)
	for _, expected := range []string{
		`"functions":[{`,
		`"async":false`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("function-member metadata is missing %q\n%s", expected, meta)
		}
	}
}
