package test

import (
	"bytes"
	"encoding/json"
	"os"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// Verifies the project-mode `transform` envelope records the SDK opt-in it read,
// with the value it read, so a persistent consumer can withdraw the transform
// when the opt-in changes.
//
// The SDK contributor decides from NESTIA_SDK_TRANSFORM whether the metadata
// pass joins the emit. Read with os.Getenv, nothing recorded it, and a consumer
// that keeps transforms across runs, such as `@ttsc/unplugin`, could serve an
// enabled run's decorated output to a disabled one (samchon/ttsc#1852). The
// gate now reads through the program's Env, and the envelope publishes the
// program's ledger as `environmentInputs`, as ttsc's own transform host does.
//
//  1. Run the project-mode `transform` with NESTIA_SDK_TRANSFORM=1 and decode
//     the envelope: the opt-in is recorded as "1".
//  2. Unset the opt-in and run again: it is recorded as null, the unset value.
//
// @evidence contracts/testing.md#behavioral-verification The real core `transform` subcommand runs with the linked SDK contributor over authored fixture sources; the decoded stdout envelope is the observed behavior.
// @evidence contracts/testing.md#independent-expectations The expected entries are the literal value the test set and JSON null for an unset variable, the ttsc protocol's wire shape, declared here rather than taken from the producer's struct.
// @evidence contracts/testing.md#distinguishing-cases A set and an unset opt-in must publish different recorded values; an envelope that omitted the read or reported the ambient value fails one of them.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this composed-native source-operation Test. It loads authored TypeScript in-process through RunWithOutput into test-owned buffers; t.Setenv restores the variable and t.TempDir releases the tsconfig; no native binary build, JavaScript emit or host runs.
func TestSDKEnvGateRecordedInTransformEnvelope(t *testing.T) {
	root := repoRoot(t)
	temp := writeFeatureTsconfig(t, root, "body", []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	recorded := func() map[string]*string {
		t.Helper()
		out := &bytes.Buffer{}
		errOut := &bytes.Buffer{}
		code := transform.RunWithOutput([]string{
			"transform",
			"--cwd", temp,
			"--tsconfig", "tsconfig.json",
			"--plugins-json", coreOnlyPlugins,
		}, out, errOut)
		if code != 0 {
			t.Fatalf("project-mode transform exited %d\n%s", code, errOut.String())
		}
		envelope := struct {
			EnvironmentInputs map[string]*string `json:"environmentInputs"`
		}{}
		if err := json.Unmarshal(out.Bytes(), &envelope); err != nil {
			t.Fatalf("project-mode transform did not publish a JSON envelope: %v\n%s", err, out.String())
		}
		return envelope.EnvironmentInputs
	}

	t.Setenv("NESTIA_SDK_TRANSFORM", "1")
	enabled, ok := recorded()["NESTIA_SDK_TRANSFORM"]
	if !ok || enabled == nil || *enabled != "1" {
		t.Fatalf("an enabled opt-in is recorded as \"1\", got present=%v value=%v", ok, enabled)
	}
	if err := os.Unsetenv("NESTIA_SDK_TRANSFORM"); err != nil {
		t.Fatal(err)
	}
	disabled, ok := recorded()["NESTIA_SDK_TRANSFORM"]
	if !ok || disabled != nil {
		t.Fatalf("an unset opt-in is recorded as null, got present=%v value=%v", ok, disabled)
	}
}
