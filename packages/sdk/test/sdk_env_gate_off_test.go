package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// Verifies the SDK contributor stays inert on the core `transform` subcommand
// when NESTIA_SDK_TRANSFORM is unset, so a core-only project never gets the
// OperationMetadata decorator injected.
//
// collectSDKEmitTransform gates on shouldRunSDKContributorTransform; with the env
// flag unset it must return early (the false arm of the gate), so the contributor
// emit transform is never wired and no @nestia/sdk import or OperationMetadata
// decorator appears. The activation test covers the true arm; this pins the false
// arm in-process through the no-disk-emit `transform` subcommand.
//
//  1. Run `transform --out <ts>` over TypedBodyController with only @nestia/core
//     and NESTIA_SDK_TRANSFORM unset.
//  2. Read the emitted TypeScript back.
//  3. Assert it carries neither the OperationMetadata decorator nor the
//     @nestia/sdk import.
//
// @evidence contracts/testing.md#behavioral-verification With only the core manifest and the SDK opt-in unset, transformation must succeed without OperationMetadata or any SDK reference.
// @evidence contracts/testing.md#independent-expectations The optional SDK contributor must remain inactive absent either explicit SDK selection or runtime opt-in.
// @evidence contracts/testing.md#distinguishing-cases The test removes an ambient opt-in within t.Setenv restoration, then forbids both metadata and imports. Its enabled twin changes only the activation state.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this unit Test; it loads authored fixture source and executes registered native analysis/emit operations in-process, with temporary files and program closure owned by the test. It neither builds a native artifact nor starts a consumer host; SDK CLI/runtime cohorts own that connection.
func TestSDKEnvGateOffSkipsContributor(t *testing.T) {
	root := repoRoot(t)
	temp := writeFeatureTsconfig(t, root, "body", []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	file := filepath.Join(root, "tests/test-sdk/features/body/src/controllers/TypedBodyController.ts")
	outFile := filepath.Join(temp, "out.ts")
	// Make sure the gate env is unset for this run even if the ambient
	// environment carries it.
	t.Setenv("NESTIA_SDK_TRANSFORM", "")
	if err := os.Unsetenv("NESTIA_SDK_TRANSFORM"); err != nil {
		t.Fatal(err)
	}
	code := transform.Run([]string{
		"transform",
		"--cwd", temp,
		"--tsconfig", "tsconfig.json",
		"--file", file,
		"--out", outFile,
		"--plugins-json", coreOnlyPlugins,
	})
	if code != 0 {
		t.Fatalf("transform subcommand exited %d", code)
	}
	data, err := os.ReadFile(outFile)
	if err != nil {
		t.Fatalf("read transform output: %v", err)
	}
	text := string(data)
	for _, forbidden := range []string{
		`OperationMetadata`,
		`@nestia/sdk`,
	} {
		if strings.Contains(text, forbidden) {
			t.Fatalf("gate-off transform unexpectedly injected %q\n%s", forbidden, text)
		}
	}
}
