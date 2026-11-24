package test

import (
	"bytes"
	"encoding/json"
	"io"
	"path/filepath"
	"testing"

	"github.com/samchon/nestia/packages/core/native/transform"
)

// Verifies the resident check drops its Program after the SDK metadata pass
// ran, and keeps it while the pass is off.
//
// The OperationMetadata emit transform prepends its decorator and import to the
// modifier and statement lists of the source file it is handed, which on an
// untouched controller method are the parsed source's own lists. A resident
// Program it ran on would show the next cycle a rewritten source, so the core
// host's check-serve must load a fresh Program after any cycle in which the
// pass joined the chain. The opt-in is NESTIA_SDK_TRANSFORM, read through the
// Program; without it the same requests update the resident Program.
//
//  1. Without the opt-in, check a controller project twice through
//     check-serve: one load, then one update.
//  2. With NESTIA_SDK_TRANSFORM=1, repeat: both cycles pass and the second one
//     loads a fresh Program.
//
// @evidence contracts/testing.md#behavioral-verification The real core check-serve dispatcher runs with the linked SDK contributor over authored fixture sources; each JSON reply's status and residency telemetry are asserted.
// @evidence contracts/testing.md#independent-expectations The ttsc resident check protocol defines programLoads, programUpdates and reused, declared here rather than taken from the host's struct; the opt-in's documented value "1" selects the metadata pass.
// @evidence contracts/testing.md#distinguishing-cases The sessions differ only in the opt-in: unset is the resident twin of the enabled pass; reload triggers and generic contributor handling belong to the core module's check-serve tests.
// @evidence contracts/testing.md#execution-ownership The SDK Go runner discovers this composed-native Test. It drives check-serve in-process through RunWithIO with test-owned streams; t.Setenv restores the opt-in and t.TempDir releases the tsconfig; no native binary build or ttsc launcher runs.
func TestSDKCheckServeReloadsAfterMetadataPass(t *testing.T) {
	root := repoRoot(t)
	temp := writeCheckedFeatureTsconfig(t, root, "body", []string{
		"controllers/TypedBodyController.ts",
		"api/structures/IBbsArticle.ts",
	})
	controller := filepath.ToSlash(filepath.Join(root, "packages/sdk/test/fixtures/body/src/controllers/TypedBodyController.ts"))
	type reply struct {
		Status    int    `json:"status"`
		Stderr    string `json:"stderr"`
		Telemetry struct {
			ProgramLoads   int  `json:"programLoads"`
			ProgramUpdates int  `json:"programUpdates"`
			Reused         bool `json:"reused"`
		} `json:"telemetry"`
	}
	session := func() []reply {
		t.Helper()
		in := bytes.NewBufferString("{}\n{\"changed\":[\"" + controller + "\"]}\n")
		out := &bytes.Buffer{}
		errOut := &bytes.Buffer{}
		code := transform.RunWithIO([]string{
			"check-serve",
			"--cwd", temp,
			"--tsconfig", "tsconfig.json",
			"--plugins-json", coreOnlyPlugins,
		}, in, out, errOut)
		if code != 0 {
			t.Fatalf("check-serve exited %d\n%s", code, errOut.String())
		}
		replies := []reply{}
		decoder := json.NewDecoder(out)
		for {
			var next reply
			if err := decoder.Decode(&next); err == io.EOF {
				break
			} else if err != nil {
				t.Fatalf("check-serve wrote a malformed reply: %v", err)
			}
			if next.Status != 0 {
				t.Fatalf("check-serve reply status %d\n%s", next.Status, next.Stderr)
			}
			replies = append(replies, next)
		}
		if len(replies) != 2 {
			t.Fatalf("check-serve answered %d of 2 requests", len(replies))
		}
		return replies
	}
	telemetry := func(label string, got reply, loads, updates int, reused bool) {
		t.Helper()
		if got.Telemetry.ProgramLoads != loads || got.Telemetry.ProgramUpdates != updates || got.Telemetry.Reused != reused {
			t.Fatalf("%s: loads=%d updates=%d reused=%v, want loads=%d updates=%d reused=%v", label,
				got.Telemetry.ProgramLoads, got.Telemetry.ProgramUpdates, got.Telemetry.Reused, loads, updates, reused)
		}
	}

	t.Setenv("NESTIA_SDK_TRANSFORM", "")
	plain := session()
	telemetry("off, first", plain[0], 1, 0, false)
	telemetry("off, second", plain[1], 1, 1, true)

	t.Setenv("NESTIA_SDK_TRANSFORM", "1")
	enabled := session()
	telemetry("on, first", enabled[0], 1, 0, false)
	telemetry("on, second", enabled[1], 2, 0, false)
}
