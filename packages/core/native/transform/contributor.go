package transform

import (
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

type emitTransformCollector func(*driver.Program, plugin.Plan) (driver.PluginTransform, []Diagnostic)

var emitTransformCollectors []emitTransformCollector

// RegisterEmitTransformCollector registers a statically linked contributor's
// emit-phase AST transformer. The `transform` subcommand runs these inside the
// shared EmitContext alongside the typia and core node transforms, so a linked
// contributor (e.g. @nestia/sdk) participates in the node-path source-to-source
// output the same way its source-rewrite collector did on the legacy text path.
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
