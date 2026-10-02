package test

import (
	"strings"
	"testing"
)

// TestSDKMetadataPreservesTypedExceptions verifies native analysis records
// the authored typed exceptions of a controller in the exceptions of its
// operation metadata, and the @throws description beside them.
//
// The Swagger generator reads exceptions from this metadata, so an exception
// type present only in a parameter or response would not reach it.
//
//  1. Analyze ExceptionController with the SDK metadata operation.
//  2. Decode the injected OperationMetadata literals.
//  3. Assert the exceptions entries name the TypeGuardError and the three
//     authored error types, and the throws tag keeps its text.
//
// @evidence contracts/testing.md#behavioral-verification SDK analysis must retain, within the decoded exceptions entries, TypeGuardError and all three authored named error types, and the throws description in the metadata, so a name that appears only outside the exceptions cannot satisfy it.
// @evidence contracts/testing.md#independent-expectations The handwritten TypedException declarations and JSDoc specify the exception identities and 400 invalid request text independently of emitted JSON.
// @evidence contracts/testing.md#distinguishing-cases This pins exception association in direct analysis; the in-process metadata case additionally checks union constituents and guard schema fields. Exact type order is required on the two four-decorator methods, and a JSDoc-only method must carry zero typed exceptions; numeric statuses belong to runtime decorator composition, not this native protocol.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKMetadataPreservesTypedExceptions(t *testing.T) {
	_, prog := loadFeatureProgram(t, "exception", []string{
		"controllers/ExceptionController.ts",
		"api/structures/IBbsArticle.ts",
		"api/structures/IExceptional.ts",
		"api/structures/IInternalServerError.ts",
		"api/structures/INotFound.ts",
		"api/structures/IUnprocessibleEntity.ts",
	})
	defer prog.Close()
	literals := collectEmittedMetadata(t, prog)
	if len(literals) != 5 {
		t.Fatalf("expected five exception operations, got %d", len(literals))
	}
	for _, operation := range []int{0, 4} {
		exceptions := syntheticField(t, decodeSyntheticMetadata(t, literals[operation]), "exceptions").([]any)
		expected := []string{"TypeGuardError", "INotFound", "IUnprocessibleEntity", "IInternalServerError"}
		if len(exceptions) != len(expected) {
			t.Fatalf("operation %d exceptions = %v, want four authored types", operation, exceptions)
		}
		for index, name := range expected {
			if actual := syntheticField(t, syntheticField(t, exceptions[index], "type"), "name"); actual != name {
				t.Errorf("operation %d exception %d type = %v, want %s", operation, index, actual, name)
			}
		}
	}
	if tagsOnly := syntheticField(t, decodeSyntheticMetadata(t, literals[3]), "exceptions").([]any); len(tagsOnly) != 0 {
		t.Fatalf("JSDoc-only throws invented typed exception metadata: %v", tagsOnly)
	}
	var exceptionParts []string
	for _, literal := range literals {
		metadata := decodeSyntheticMetadata(t, literal)
		exceptionParts = append(exceptionParts, canonicalJSON(t, syntheticField(t, metadata, "exceptions")))
	}
	exceptions := strings.Join(exceptionParts, "\n")
	for _, expected := range []string{
		`"name":"TypeGuardError`,
		`"name":"INotFound"`,
		`"name":"IUnprocessibleEntity"`,
		`"name":"IInternalServerError"`,
	} {
		if !strings.Contains(exceptions, expected) {
			t.Fatalf("the exceptions of the OperationMetadata JSON are missing %q\n%s", expected, exceptions)
		}
	}
	meta := strings.Join(literals, "\n")
	for _, expected := range []string{`"name":"throws"`, `"text":"400 invalid request"`} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("OperationMetadata JSON is missing %q\n%s", expected, meta)
		}
	}
}
