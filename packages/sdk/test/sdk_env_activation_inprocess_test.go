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
// collectSDKEmitTransform -> EmitTransform IN-PROCESS with zero disk pollution.
//
//  1. Run `transform --out <ts>` over TypedBodyController with only @nestia/core
//     in --plugins-json and NESTIA_SDK_TRANSFORM=1.
//  2. Read the emitted TypeScript back.
//  3. Assert it carries the OperationMetadata decorator and the @nestia/sdk
//     namespace import the contributor injects.
func TestSDKEnvFlagActivatesContributorInProcess(t *testing.T) {
	root := repoRoot(t)
	temp := writeFeatureTsconfig(t, root, "body", []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	file := filepath.Join(root, "tests/test-sdk/features/body/src/controllers/TypedBodyController.ts")
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
