package transform

import (
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

type emitTransformCollector func(*driver.Program, plugin.Plan) (driver.PluginTransform, []Diagnostic)

var emitTransformCollectors []emitTransformCollector

// RegisterEmitTransformCollector registers a statically linked contributor's
// emit-phase AST transformer. The `build` and `transform` subcommands run these
// inside the shared EmitContext alongside the typia and core node transforms, so
// a linked contributor (e.g. @nestia/sdk) participates in the same emit pass
// rather than patching its output afterwards.
//
// @evidence contracts/common.md#principled-implementation A statically linked contributor registers a collector once at package initialization, and the host runs all collectors in registration order inside the shared emit pass, so contributors take part in the same emit rather than rewriting its output afterwards; a nil collector is ignored.
// @evidence contracts/common.md#clear-and-simple-design One append to a package-level list, read by one private function.
// @evidence contracts/common.md#prohibited-implementation-shortcuts It is the documented registration point for linked contributors, not a hook into foreign code; the list is written only during initialization, which is single-threaded.
// @evidence contracts/common.md#meaningful-documentation The comment states who calls it, when the collectors run, and why.
func RegisterEmitTransformCollector(collector emitTransformCollector) {
	if collector != nil {
		emitTransformCollectors = append(emitTransformCollectors, collector)
	}
}

func collectContributorEmitTransforms(
	prog *driver.Program,
	plan plugin.Plan,
) ([]driver.PluginTransform, []Diagnostic) {
	transforms := []driver.PluginTransform{}
	diagnostics := []Diagnostic{}
	for _, collector := range emitTransformCollectors {
		t, diags := collector(prog, plan)
		diagnostics = append(diagnostics, diags...)
		if t != nil {
			transforms = append(transforms, t)
		}
	}
	return transforms, diagnostics
}
