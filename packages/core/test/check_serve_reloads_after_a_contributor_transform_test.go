package test

import (
	"path/filepath"
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestCheckServeReloadsAfterAContributorTransform verifies the resident check
// never hands a Program to a cycle after a contributor transform ran on it.
//
// A statically linked contributor's emit transform, such as the @nestia/sdk
// OperationMetadata pass, may prepend nodes to the source lists it is given, so
// a Program it ran on can no longer be checked as the saved source. The host
// cannot see what a contributor did, so any cycle in which one ran must drop
// the Program. Without a contributor the same requests update the resident
// Program, which keeps this case from passing merely because the host always
// reloads.
//
//  1. Register a passthrough contributor gated on a sentinel plugin entry, so
//     every other program in this test binary stays unaffected.
//  2. Run two cycles without the sentinel: one load, then one update.
//  3. Run two cycles with the sentinel: the contributor runs, and the second
//     cycle loads a fresh Program instead of updating.
//
// @evidence contracts/testing.md#behavioral-verification The check-serve dispatcher runs two scripted sessions through RunWithIO; the contributor's call count and each reply's status and residency telemetry are asserted.
// @evidence contracts/testing.md#independent-expectations The resident check protocol defines programLoads, programUpdates and reused; the sentinel collector's own counter establishes independently that the contributor ran.
// @evidence contracts/testing.md#distinguishing-cases The sessions differ only in the sentinel entry: without it the second save is an update, with it a load; edit and reload triggers are owned by TestCheckServeAnswersEditsOnOneProgram and TestCheckServeReloadsWhenItCannotUpdate.
// @evidence contracts/testing.md#execution-ownership Go discovers this case in the core test module; collector registration and both sessions run in-process, and the sentinel keeps the persistent registration inert for later cases. It does not prove ttsc contributor linking, which the SDK boundary harness owns.
func TestCheckServeReloadsAfterAContributorTransform(t *testing.T) {
	calls := 0
	transform.RegisterEmitTransformCollector(func(_ *driver.Program, plan plugin.Plan) (driver.PluginTransform, []transform.Diagnostic) {
		for _, entry := range plan.Entries {
			if entry.Name == "test-check-serve-contributor" {
				return func(_ *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
					calls++
					return sf
				}, nil
			}
		}
		return nil, nil
	})

	project := writeLlmRouteBuildProject(t, llmRouteBuildProjectOptions{Valid: true})
	request := `{"changed":["` + filepath.ToSlash(filepath.Join(project.Root, "src", "main.ts")) + `"]}`
	session := func(pluginsJSON string) []checkServeReply {
		return runCheckServeSession(t, []string{
			"--cwd", project.Root,
			"--tsconfig", "tsconfig.json",
			"--plugins-json", pluginsJSON,
		}, []checkServeStep{{Request: `{}`}, {Request: request}})
	}

	plain := session(coreNativePlugins("assert", "assert"))
	if calls != 0 {
		t.Fatalf("the sentinel contributor ran without its entry %d times", calls)
	}
	mustReplyTelemetry(t, 0, plain[0], 1, 0, false)
	mustReplyTelemetry(t, 1, plain[1], 1, 1, true)

	contributed := session(`[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":"assert"}},` +
		`{"name":"test-check-serve-contributor","stage":"transform","config":{}}]`)
	if calls == 0 {
		t.Fatal("the sentinel contributor never ran")
	}
	for index, reply := range append(plain, contributed...) {
		if reply.Status != 0 {
			t.Fatalf("reply %d status %d\nstderr=%s", index, reply.Status, reply.Stderr)
		}
	}
	mustReplyTelemetry(t, 0, contributed[0], 1, 0, false)
	mustReplyTelemetry(t, 1, contributed[1], 2, 0, false)
}
