package test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// Verifies the NESTIA_SDK_TRANSFORM env flag alone activates the linked SDK
// contributor through the core `transform` subcommand, even when the plugin plan
// carries only @nestia/core.
//
// The nestia CLI materializes user code with only the aggregate @nestia/core
// host in compilerOptions.plugins; the SDK is statically linked as a core
// contributor whose collectSDKEmitTransform is gated on
// shouldRunSDKContributorTransform (NESTIA_SDK_TRANSFORM=="1"), not on a
// top-level @nestia/sdk plugin entry. The `transform` subcommand prints rewritten
// TypeScript to --out (it never emits .js to the @nestia/* workspace sources), so
// it drives that env-gated branch -> collectContributorEmitTransforms ->
// collectSDKEmitTransform -> EmitTransform in-process. The printer writes only
// the test-owned temporary TypeScript output; no JavaScript product is emitted.
//
//  1. Run `transform --out <ts>` over TypedBodyController with only @nestia/core
//     in --plugins-json and NESTIA_SDK_TRANSFORM=1.
//  2. Read the emitted TypeScript back.
//  3. Assert it carries the OperationMetadata decorator and the @nestia/sdk
//     namespace import the contributor injects.
//
// @evidence contracts/testing.md#behavioral-verification With only the core manifest and NESTIA_SDK_TRANSFORM=1, native transformation must inject the SDK import and OperationMetadata call.
// @evidence contracts/testing.md#independent-expectations The CLI runtime opt-in requests the linked SDK contributor without a separate plugin descriptor; its operation metadata is part of that activation contract.
// @evidence contracts/testing.md#distinguishing-cases This owns enabled TypeScript transformation. The gate-off twin forbids SDK references on the same body fixture, without claiming emitted-JavaScript build dispatch.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this composed-native source-operation Test. It loads authored TypeScript, runs typia/core and the env-gated SDK collector in one EmitContext, and prints a test-owned temporary TS file. The program closes in runTransform and t.TempDir releases the artifact; no native binary build, JavaScript product emit, installed consumer or host occurs. The private env registration cannot be proved by bypassing it with direct EmitTransform.
func TestSDKEnvFlagActivatesContributorInProcess(t *testing.T) {
	root := repoRoot(t)
	temp := writeFeatureTsconfig(t, root, "body", []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	file := filepath.Join(root, "packages/sdk/test/fixtures/body/src/controllers/TypedBodyController.ts")
	outFile := filepath.Join(temp, "out.ts")
	t.Setenv("NESTIA_SDK_TRANSFORM", "1")
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
	for _, expected := range []string{
		`from "@nestia/sdk"`,
		`.OperationMetadata(`,
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("transformed TypeScript is missing %q\n%s", expected, text)
		}
	}
}
