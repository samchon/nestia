package test

import "testing"

// Verifies a return type carrying a function-typed property serializes its
// function signature (the async flag and the output schema) through the metadata
// JSON writer.
//
// nestiaSDKMetadataSchemaLiteral emits a "functions" array via
// nestiaSDKMetadataFunctions whenever typia's MetadataFactory reflects a function
// member on an object. None of the tests/test-sdk-e2e controllers return such a type,
// so the function-serialization arm stays dark; a synthetic controller returning
// an interface with a callable member is the only in-process driver for it. (The
// current typia reflection leaves the function's parameter list empty for an
// object-property function type, so nestiaSDKMetadataParameters' loop body is not
// reachable through this path — it mirrors the IParameter shape defensively.)
//
//  1. Author a controller returning an object whose property is a function type.
//  2. Run the SDK metadata pass over it in-process (no disk emit).
//  3. Assert the emitted metadata carries the reflected function entry.
//
// @evidence contracts/testing.md#behavioral-verification Metadata for an authored function-valued property must retain a function entry with async false.
// @evidence contracts/testing.md#independent-expectations The fixture property has a synchronous number-to-string function signature; its callable nature and synchronous marker must survive reflection.
// @evidence contracts/testing.md#distinguishing-cases This owns synchronous function-member presence; rich-schema and scalar cases own other metadata categories. It does not assert all argument/return schema details.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
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
	metadata := decodeSyntheticMetadata(t, buildSyntheticMetadata(t, controller))
	data := syntheticField(t, syntheticField(t, syntheticField(t, metadata, "success"), "primitive"), "data")
	objects := syntheticField(t, syntheticField(t, data, "components"), "objects").([]any)
	properties := syntheticField(t, objects[0], "properties").([]any)
	if len(properties) != 1 {
		t.Fatalf("expected the single invoke member, got %d properties", len(properties))
	}
	if key := syntheticMetadataConstant(t, syntheticField(t, properties[0], "key")); key != "invoke" {
		t.Fatalf("the member is %v, expected invoke", key)
	}
	functions := syntheticField(t, syntheticField(t, properties[0], "value"), "functions").([]any)
	if len(functions) != 1 || syntheticField(t, functions[0], "async") != false {
		t.Fatalf("the invoke member carries %v, expected one synchronous function signature", functions)
	}
}
