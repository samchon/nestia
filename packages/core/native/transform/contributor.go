package transform

import (
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// BuildOutputRewriter patches emitted JavaScript after the core native
// rewrites have been applied. Contributor packages register these from init().
type BuildOutputRewriter struct {
	Len   func() int
	Apply func(outputName string, text string) (string, error)
}

type buildOutputRewriteCollector func(*driver.Program, plugin.Plan) (*BuildOutputRewriter, []Diagnostic)
type sourceRewriteCollector func(*driver.Program, plugin.Plan, string) (map[string][]SourceRewrite, []Diagnostic)
type emitTransformCollector func(*driver.Program, plugin.Plan) (driver.PluginTransform, []Diagnostic)

var buildOutputRewriteCollectors []buildOutputRewriteCollector
var sourceRewriteCollectors []sourceRewriteCollector
var emitTransformCollectors []emitTransformCollector

// RegisterBuildOutputRewriteCollector registers a statically linked
// contributor's emitted-JavaScript rewrite pass.
func RegisterBuildOutputRewriteCollector(collector buildOutputRewriteCollector) {
	if collector != nil {
		buildOutputRewriteCollectors = append(buildOutputRewriteCollectors, collector)
	}
}

// RegisterSourceRewriteCollector registers a statically linked contributor's
// TypeScript source-to-source rewrite pass.
func RegisterSourceRewriteCollector(collector sourceRewriteCollector) {
	if collector != nil {
		sourceRewriteCollectors = append(sourceRewriteCollectors, collector)
	}
}

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

func collectContributorBuildOutputRewriters(
	prog *driver.Program,
	plan plugin.Plan,
) ([]BuildOutputRewriter, []Diagnostic) {
	output := []BuildOutputRewriter{}
	diagnostics := []Diagnostic{}
	for _, collector := range buildOutputRewriteCollectors {
		rewriter, diags := collector(prog, plan)
		diagnostics = append(diagnostics, diags...)
		if rewriter != nil && rewriter.Apply != nil {
			output = append(output, *rewriter)
		}
	}
	return output, diagnostics
}

func collectContributorSourceRewriteMap(
	prog *driver.Program,
	plan plugin.Plan,
	onlyFile string,
) (map[string][]SourceRewrite, []Diagnostic) {
	output := map[string][]SourceRewrite{}
	diagnostics := []Diagnostic{}
	for _, collector := range sourceRewriteCollectors {
		rewrites, diags := collector(prog, plan, onlyFile)
		diagnostics = append(diagnostics, diags...)
		for file, entries := range rewrites {
			output[file] = append(output[file], entries...)
		}
	}
	return output, diagnostics
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
