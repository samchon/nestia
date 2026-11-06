package test

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"testing"

	"github.com/samchon/ttsc/packages/ttsc/driver"
)

type emitObservationPlugin struct{}

// ApplyProgram reports an authored external read through the supported linked
// hook API; the per-invocation mode controls explicit incomplete/conflicting proof.
func (emitObservationPlugin) ApplyProgram(_ *driver.Program, ctx driver.PluginContext) error {
	file, _ := ctx.Entry.Config["file"].(string)
	data, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	hash := sha256.Sum256(data)
	digest := hex.EncodeToString(hash[:])
	physical, err := filepath.EvalSymlinks(file)
	if err != nil {
		return err
	}
	ctx.ReportHostInputHash(file, &digest)
	ctx.ReportHostInputRealpath(file, &physical)
	switch ctx.Entry.Config["mode"] {
	case "incomplete":
		ctx.ReportObservationIncomplete()
	case "conflict":
		other := "different-consumed-content"
		ctx.ReportHostInputHash(file, &other)
	case "unknown":
		ctx.ReportHostInput(file + ".unknown")
	}
	return nil
}

// TestBuildEmitExternalObservations verifies linked-hook observations survive
// aggregate emission without upgrading missing or conflicting proof.
//
// An aggregate may include contributors that read outside the compiler graph;
// their reports must reach the same private result as core and typia inputs.
//
// 1. Register one linked hook and report one real external read.
// 2. Contrast complete, explicitly incomplete, conflicting and unknown inputs.
// 3. Verify the output channel preserves every refusal distinction.
//
// @evidence contracts/testing.md#behavioral-verification Actual native build dispatch executes a registered ProgramPlugin and publishes its external input name, consumed hash and physical identity. Explicit incompleteness, conflicting hashes and unknown inputs must remain non-authoritative.
// @evidence contracts/testing.md#independent-expectations Authored external bytes establish SHA-256 and native realpath; the hook deliberately supplies distinct conflicting facts or explicit incomplete status rather than deriving expected values from the result.
// @evidence contracts/testing.md#distinguishing-cases Complete proof is the positive control; incomplete retains known facts but denies the population, conflict withdraws the hash, and unknown retains an unproved name. Every case still runs an otherwise successful aggregate build.
// @evidence contracts/testing.md#execution-ownership Canonical core Go tests call build in-process. One registration remains inert outside the scoped LinkedPluginsEnv payload, restored by t.Setenv; temporary projects own inputs and result files, without a separately compiled host.
func TestBuildEmitExternalObservations(t *testing.T) {
	driver.RegisterPlugin(emitObservationPlugin{})
	for _, mode := range []string{"complete", "incomplete", "conflict", "unknown"} {
		t.Run(mode, func(t *testing.T) {
			p := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
			file := filepath.Join(t.TempDir(), "external.txt")
			text := "external-transform-input"
			writeFile(t, file, text)
			payload, err := json.Marshal([]driver.PluginEntry{{Name: "observation-fixture", Stage: "transform", Config: map[string]any{"file": file, "mode": mode}}})
			if err != nil {
				t.Fatal(err)
			}
			t.Setenv(driver.LinkedPluginsEnv, string(payload))
			resultPath := filepath.Join(p.Root, "observations.json")
			_, errors, code := runCoreNative([]string{"build", "--cwd", p.Root, "--plugins-json", p.PluginsJSON, "--emit-observations-json", resultPath})
			if code != 0 {
				t.Fatalf("status=%d\n%s", code, errors)
			}
			var result struct {
				Inputs    []string           `json:"hostInputs"`
				Hashes    map[string]*string `json:"hostInputHashes"`
				Realpaths map[string]*string `json:"hostInputRealpaths"`
				Complete  *bool              `json:"observationsComplete"`
			}
			data, err := os.ReadFile(resultPath)
			if err != nil {
				t.Fatal(err)
			}
			if err := json.Unmarshal(data, &result); err != nil {
				t.Fatal(err)
			}
			physical, err := filepath.EvalSymlinks(file)
			if err != nil {
				t.Fatal(err)
			}
			if !slices.Contains(result.Inputs, file) || result.Realpaths[file] == nil || *result.Realpaths[file] != physical {
				t.Fatalf("external input lost: %#v", result)
			}
			hash := sha256.Sum256([]byte(text))
			if mode == "conflict" {
				if result.Hashes[file] != nil {
					t.Fatalf("conflict repaired: %v", result.Hashes[file])
				}
			} else if result.Hashes[file] == nil || *result.Hashes[file] != hex.EncodeToString(hash[:]) {
				t.Fatal("consumed external hash lost")
			}
			if mode == "incomplete" && (result.Complete == nil || *result.Complete) {
				t.Fatal("incomplete hook authorized reuse")
			}
			if mode == "unknown" && (!slices.Contains(result.Inputs, file+".unknown") || result.Hashes[file+".unknown"] != nil) {
				t.Fatal("unknown input was removed or proved")
			}
		})
	}
}
