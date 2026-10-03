package test

import (
	"strings"
	"testing"
)

// TestSDKMetadataPreservesTypedExceptions verifies exception associations,
// synthetic guard schema fields, union members and throws text from one native
// metadata emission. Two cases formerly loaded and transformed the same six
// source files separately; all their assertions now inspect the same literals.
//
// The Swagger generator reads exceptions from this metadata, so an exception
// type present only in a parameter or response would not reach it.
//
//  1. Analyze ExceptionController with the SDK metadata operation.
//  2. Decode the injected OperationMetadata literals.
//  3. Assert the exceptions entries name the TypeGuardError and the three
//     authored error types, and the throws tag keeps its text.
//  4. Check the original synthetic schema fields, union members and named errors.
//
// @evidence contracts/testing.md#behavioral-verification One SDK metadata emission must retain exact typed-exception associations, synthetic TypeGuardError method/expected schema fields, named errors, union constituents and throws descriptions. The original whole-metadata literal checks remain beside the decoded association checks.
// @evidence contracts/testing.md#independent-expectations The handwritten TypedException declarations, union members and JSDoc specify the expected identities and text independently of emitted JSON; the typia guard schema requires method and expected fields.
// @evidence contracts/testing.md#distinguishing-cases Exact type order is required on two four-decorator methods and a JSDoc-only method must carry zero typed exceptions. The preserved whole-metadata checks cover synthetic guard schema fields, all three union members, BadRequestException and throws text; those substring checks do not establish every association. Numeric statuses belong to runtime decorator composition.
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
	for _, expected := range []string{
		// TypeGuardError synthetic schema cluster (nestiaSDKTypeGuardErrorSchemaPipe);
		// property keys ride as string-constant schema values.
		`"name":"TypeGuardErrorany"`,
		`"value":"method"`,
		`"value":"expected"`,
		// The named exception structures collected across decorators.
		`"name":"BadRequestException"`,
		`"name":"INotFound"`,
		`"name":"IUnprocessibleEntity"`,
		`"name":"IInternalServerError"`,
		// The union exception members (IExceptional.*) and union return members,
		// which only appear once the union-order pass walks the union type node.
		`IExceptional.Something`,
		`IExceptional.Nothing`,
		`IExceptional.Everything`,
		// The @throws / @throw JSDoc tags survive into the metadata.
		`"name":"throws"`,
		`"text":"400 invalid request"`,
	} {
		if !strings.Contains(meta, expected) {
			t.Fatalf("exception metadata is missing %q\n%s", expected, meta)
		}
	}
}
