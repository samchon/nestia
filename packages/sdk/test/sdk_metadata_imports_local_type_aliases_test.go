package test

import (
	"strings"
	"testing"
)

// TestSDKMetadataImportsLocalTypeAliases verifies a native analysis records the
// local exported type alias of a transaction operation in the imports of its
// metadata.
//
// The generated SDK imports each parameter and response type from its declaring
// file, so an alias declared beside the controller must be listed with its
// source file.
//
//  1. Analyze TransactionController with the SDK contributor in-process.
//  2. Decode the injected OperationMetadata literals.
//  3. Assert an operation's parameter or success imports list PubkeyInput.
//
// @evidence contracts/testing.md#behavioral-verification SDK analysis must list exactly PubkeyInput in the sole parameter import and point to TransactionController.ts, while the void response has no imports; a name occurring only in a schema cannot satisfy these assertions.
// @evidence contracts/testing.md#independent-expectations The authored transaction signature names PubkeyInput from its local alias declaration; generated import metadata must preserve that usable source identity.
// @evidence contracts/testing.md#distinguishing-cases This owns exact local alias import collection and a void-return negative twin; native import-alias and synthetic nested reflection cases own other alias forms. The declaring file and singleton elements are checked explicitly.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKMetadataImportsLocalTypeAliases(t *testing.T) {
	_, prog := loadFeatureProgram(t, "tags", []string{"controllers/TransactionController.ts"})
	defer prog.Close()
	literals := collectEmittedMetadata(t, prog)
	if len(literals) != 1 {
		t.Fatalf("expected one transaction operation, got %d", len(literals))
	}
	metadata := decodeSyntheticMetadata(t, literals[0])
	parameters := syntheticField(t, metadata, "parameters").([]any)
	if len(parameters) != 1 {
		t.Fatalf("expected one parameter, got %d", len(parameters))
	}
	imports := syntheticField(t, parameters[0], "imports").([]any)
	if len(imports) != 1 || canonicalJSON(t, syntheticField(t, imports[0], "elements")) != `["PubkeyInput"]` {
		t.Fatalf("alias imports = %v, want exactly PubkeyInput", imports)
	}
	file := syntheticField(t, imports[0], "file").(string)
	if !strings.HasSuffix(file, "/src/controllers/TransactionController.ts") {
		t.Fatalf("alias declaring file = %q", file)
	}
	if actual := canonicalJSON(t, syntheticField(t, syntheticField(t, metadata, "success"), "imports")); actual != `[]` {
		t.Fatalf("void success gained imports = %s", actual)
	}
}
