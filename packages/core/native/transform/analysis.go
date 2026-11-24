package transform

import (
	"fmt"
	"time"

	shimcompiler "github.com/microsoft/typescript-go/shim/compiler"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/nestia/packages/core/native/transform/buildoutput"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// analysisOptions are the command settings an analysis-only run reports with.
type analysisOptions struct {
	TSConfig string
	CWD      string
	Plan     plugin.Plan
	Quiet    bool
	Profile  bool
}

// analyzeProgram answers an analysis-only run (`check`, `--noEmit`, or a
// project whose config sets noEmit) over a Program whose TypeScript
// diagnostics are already clean. It reports what the emitting lane would
// report before writing anything: the contributor collection diagnostics, the
// linked program hooks' outcome, and the typia, core and contributor transform
// diagnostics, with the same exit statuses.
//
// The transforms run on the analysis Program itself, so the run loads one
// Program, and their results are discarded without printing. Nothing here
// rewrites import paths or emits declarations: both only serve written output,
// and declaration diagnostics already belong to the noEmit Program's own
// diagnostics, as they do for `tsc --noEmit`.
//
// linkedPlugins answers the linked ProgramPlugins: ApplyLinkedPlugins for a
// one-shot run, as EmitWithPluginTransformers does, or CheckLinkedPlugins for a
// resident Program. contributed reports whether a contributor transform ran;
// the @nestia/sdk metadata pass edits the source ASTs it is given in place, so
// a resident caller must not reuse the Program afterwards.
func analyzeProgram(prog *driver.Program, options analysisOptions, linkedPlugins func() error) (status int, contributed bool) {
	releaseTypiaRegistries := registerTypiaDefaultLibraryClassifier(prog)
	defer releaseTypiaRegistries()
	// Emit is false, so the publication writes nothing; it keeps the verbose
	// summary line the emitting lane prints.
	publication := buildoutput.New(buildoutput.Options{
		TSConfig: options.TSConfig, CWD: options.CWD,
		Core: options.Plan.Core, SDK: options.Plan.SDK, Typia: options.Plan.Typia,
		Emit: false, Quiet: options.Quiet,
	}, stdout, driver.DefaultWriteFile)
	defer publication.Finish(false)

	transformDiags := []Diagnostic{}
	transforms, contributors, contributorDiags := buildTransforms(prog, options.Plan, func(diag Diagnostic) {
		transformDiags = append(transformDiags, diag)
	})
	if len(contributorDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, contributorDiags, options.CWD)
		return 3, false
	}
	if err := linkedPlugins(); err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: emit failed: %v\n", err)
		return 3, false
	}
	var started time.Time
	if options.Profile {
		started = time.Now()
	}
	runAnalysisTransforms(prog, transforms)
	profileBuildStep(options.Profile, "analysis-transforms", started)
	if len(transformDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, transformDiags, options.CWD)
		return 3, contributors != 0
	}
	return 0, contributors != 0
}

// buildTransforms assembles the emit-phase transform chain both lanes run:
// typia, then core, then every statically linked contributor (for example the
// @nestia/sdk OperationMetadata pass) in registration order, all sharing one
// EmitContext per file, mirroring the `transform` subcommand. A contributor
// that opted in through its own flag (NESTIA_SDK_TRANSFORM) rather than the
// ttsc linked-plugin registry would otherwise never run. It also returns how
// many contributor transforms joined the chain, and the contributors'
// collection diagnostics, which leave no chain.
func buildTransforms(prog *driver.Program, plan plugin.Plan, addDiagnostic func(Diagnostic)) ([]driver.PluginTransform, int, []Diagnostic) {
	typiaTransform := nestiaTypiaNodeTransform(prog, readTypiaPluginOptions(plan), addDiagnostic)
	coreTransform := nestiaCoreNodeTransform(prog, plan, addDiagnostic)
	contributorTransforms, contributorDiags := collectContributorEmitTransforms(prog, plan)
	if len(contributorDiags) > 0 {
		return nil, 0, contributorDiags
	}
	return append([]driver.PluginTransform{typiaTransform, coreTransform}, contributorTransforms...), len(contributorTransforms), nil
}

// runAnalysisTransforms hands each file the emit pipeline would transform to
// the chain, in order, with a fresh EmitContext per file as
// EmitWithPluginTransformers does, and discards the result.
//
// The files are the compiler's own emit selection (GetSourceFilesToEmit), which
// does not depend on noEmit, so the analysis Program yields the population an
// emitting Program of the same project would. The emitting lane additionally
// skips outputs outside outDir; a Program that reached this point has no
// diagnostics, so its common source directory holds every emitted file and none
// of their outputs leaves outDir.
func runAnalysisTransforms(prog *driver.Program, transforms []driver.PluginTransform) {
	for _, file := range shimcompiler.SourceFilesToEmit(prog.TSProgram) {
		ec := shimprinter.NewEmitContext()
		out := file
		for _, transform := range transforms {
			if transform == nil {
				continue
			}
			if next := transform(ec, out); next != nil {
				out = next
			}
		}
	}
}
