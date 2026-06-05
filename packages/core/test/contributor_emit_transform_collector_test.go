package test

import (
	"testing"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/nestia/packages/core/native/transform"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestContributorEmitTransformCollector verifies the statically linked
// contributor seam the @nestia/sdk Go module uses: RegisterEmitTransformCollector
// feeds collectContributorEmitTransforms, which the transform subcommand runs
// inside the shared EmitContext, and a contributor diagnostic aborts the run
// with exit 3.
//
// This is the only path by which a second Go module participates in the node
// emit besides typia and core. The collector receives the parsed Plan, so it can
// opt out of programs it does not own; gating on a sentinel plugin entry keeps
// the registered collector inert for every other test in this binary while still
// exercising both observable branches here. A regression that dropped the
// collector loop or stopped surfacing its diagnostics would let an SDK metadata
// failure pass silently. Output stays in memory / on stdout, so nothing is
// written to the source tree.
//
//  1. Register a collector gated on a sentinel entry name; assert nil collectors
//     are ignored by the nil guard.
//  2. Run transform with the sentinel present and a passthrough transform; assert
//     exit 0 (the contributor transform ran and emitted nothing extra).
//  3. Run transform with the sentinel asking for a diagnostic; assert exit 3.
func TestContributorEmitTransformCollector(t *testing.T) {
	// The nil guard must drop a nil collector without registering it.
	transform.RegisterEmitTransformCollector(nil)

	transform.RegisterEmitTransformCollector(func(prog *driver.Program, plan plugin.Plan) (driver.PluginTransform, []transform.Diagnostic) {
		mode := contributorSentinelMode(plan)
		switch mode {
		case "pass":
			return func(_ *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
				return sf
			}, nil
		case "diag":
			return nil, []transform.Diagnostic{{
				Code:    "test.contributor.sentinel",
				Message: "sentinel contributor diagnostic",
			}}
		default:
			// Inert for every program that does not carry the sentinel, so other
			// tests in this binary are unaffected.
			return nil, nil
		}
	})

	cwd := featureRootForCore(t, "body")
	file := featureSource(t, "body", "controllers/TypedBodyController.ts")

	if code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", file,
		"--plugins-json", contributorSentinelPlugins("pass"),
	}); code != 0 {
		t.Fatalf("passthrough contributor transform should exit 0, got %d", code)
	}

	if code := transform.Run([]string{
		"transform",
		"--cwd", cwd,
		"--tsconfig", "tsconfig.json",
		"--file", file,
		"--plugins-json", contributorSentinelPlugins("diag"),
	}); code != 3 {
		t.Fatalf("contributor diagnostic should abort with exit 3, got %d", code)
	}
}

// contributorSentinelPlugins composes a @nestia/core manifest carrying a sentinel
// entry whose name encodes the desired collector behavior.
func contributorSentinelPlugins(mode string) string {
	return `[{"name":"@nestia/core","stage":"transform","config":{"transform":"@nestia/core/lib/transform","validate":"assert","stringify":"assert"}},` +
		`{"name":"test-contributor-sentinel","stage":"transform","config":{"mode":"` + mode + `"}}]`
}

// contributorSentinelMode reads the sentinel mode out of the parsed plan, or ""
// when the sentinel entry is absent (so the collector stays inert).
func contributorSentinelMode(plan plugin.Plan) string {
	for _, entry := range plan.Entries {
		if entry.Name != "test-contributor-sentinel" {
			continue
		}
		if mode, ok := entry.Config["mode"].(string); ok {
			return mode
		}
	}
	return ""
}
