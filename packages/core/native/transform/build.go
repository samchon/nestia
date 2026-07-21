package transform

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"time"

	shimcompiler "github.com/microsoft/typescript-go/shim/compiler"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	typiaadapter "github.com/samchon/typia/packages/typia/native/adapter"
)

func runBuild(args []string) int {
	profile := os.Getenv("TTSC_NESTIA_PROFILE") != ""
	var totalStarted time.Time
	if profile {
		totalStarted = time.Now()
	}
	fs := flag.NewFlagSet("build", flag.ContinueOnError)
	fs.SetOutput(stderr)
	tsconfigPath := fs.String("tsconfig", "tsconfig.json", "path to tsconfig.json")
	cwdOverride := fs.String("cwd", "", "override the working directory")
	quiet := fs.Bool("quiet", true, "suppress the per-call diagnostic summary")
	verbose := fs.Bool("verbose", false, "print the per-call diagnostic summary")
	emit := fs.Bool("emit", false, "force emitted .js files")
	noEmit := fs.Bool("noEmit", false, "force analysis-only run with no file writes")
	outDir := fs.String("outDir", "", "override compilerOptions.outDir")
	manifestPath := fs.String("manifest", "", "write emitted file list as JSON")
	pluginsJSON := fs.String("plugins-json", "", "ordered ttsc plugin payload")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if *emit && *noEmit {
		fmt.Fprintln(stderr, "ttsc-nestia build: --emit and --noEmit are mutually exclusive")
		return 2
	}
	if *verbose {
		*quiet = false
	}
	plan, err := plugin.ParsePlan(*pluginsJSON)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: %v\n", err)
		return 2
	}

	cwd, ok := resolveCWD("ttsc-nestia build", *cwdOverride)
	if !ok {
		return 2
	}
	var started time.Time
	if profile {
		started = time.Now()
	}
	prog, diags, err := driver.LoadProgram(cwd, *tsconfigPath, driver.LoadProgramOptions{
		ForceEmit:   *emit,
		ForceNoEmit: *noEmit,
		OutDir:      *outDir,
	})
	profileBuildStep(profile, "load-program", started)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: %v\n", err)
		return 2
	}
	if len(diags) > 0 {
		driver.WritePrettyDiagnostics(stderr, diags, cwd)
		return 2
	}
	defer prog.Close()
	if profile {
		started = time.Now()
	}
	if diags := prog.Diagnostics(); len(diags) > 0 {
		profileBuildStep(profile, "diagnostics", started)
		driver.WritePrettyDiagnostics(stderr, diags, cwd)
		return 2
	}
	profileBuildStep(profile, "diagnostics", started)

	shouldEmit := !prog.ParsedConfig.ParsedConfig.CompilerOptions.NoEmit.IsTrue()
	if !*quiet {
		fmt.Fprintf(
			stdout,
			"// ttsc-nestia build: tsconfig=%s cwd=%s core=%v sdk=%v typia=%v emit=%v\n",
			*tsconfigPath,
			cwd,
			plan.Core,
			plan.SDK,
			plan.Typia,
			shouldEmit,
		)
	}
	if !shouldEmit {
		return 0
	}

	// AST-integration emit: typia's per-file transformer and @nestia/core's own
	// per-file transformer both run inside tsgo's emit pipeline (sharing the
	// EmitContext), so they return AST and tsgo's module-transform aliases the
	// namespace imports they inject. No text-splice RewriteSet, no cleanup pass.
	transformDiags := []Diagnostic{}
	addDiagnostic := func(diag Diagnostic) {
		transformDiags = append(transformDiags, diag)
	}
	if profile {
		started = time.Now()
	}
	newPathsRewriter(prog).applyAll(prog.SourceFiles())
	profileBuildStep(profile, "paths-rewrite", started)

	typiaTransform := nestiaTypiaNodeTransform(prog, readTypiaPluginOptions(cwd, *tsconfigPath), addDiagnostic)
	coreTransform := nestiaCoreNodeTransform(prog, plan, addDiagnostic)

	// Statically linked contributors (e.g. the @nestia/sdk OperationMetadata
	// pass) run their per-file emit transformer in the same EmitContext after
	// typia and core, mirroring the `transform` subcommand. Without this the
	// build/emit path silently drops a contributor that opted in through its own
	// flag (NESTIA_SDK_TRANSFORM) rather than the ttsc linked-plugin registry, so
	// its metadata never reaches the emitted JavaScript.
	contributorTransforms, contributorDiags := collectContributorEmitTransforms(prog, plan)
	if len(contributorDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, contributorDiags, cwd)
		return 3
	}
	transforms := append([]driver.PluginTransform{typiaTransform, coreTransform}, contributorTransforms...)

	emitted := []string{}
	writeFile := shimcompiler.WriteFile(func(fileName, text string, data *shimcompiler.WriteFileData) error {
		_ = data
		emitted = append(emitted, fileName)
		return driver.DefaultWriteFile(fileName, text)
	})

	// Declaration emit: ttsc delegates the whole emit of a transform-plugin
	// package to this host, but EmitWithPluginTransformers writes only .js. A
	// library package (e.g. @nestia/core itself) ships .d.ts, so emit the
	// declarations here with tsgo's standard declaration emitter. The typia /
	// core runtime transforms never change the public type surface, so the
	// declarations are taken from the pristine program — done before the JS
	// transform runs so it reads the un-mutated AST.
	if prog.ParsedConfig.ParsedConfig.CompilerOptions.Declaration.IsTrue() {
		if profile {
			started = time.Now()
		}
		emitDeclarations(prog, writeFile)
		profileBuildStep(profile, "declaration-emit", started)
	}

	if profile {
		started = time.Now()
	}
	eDiags, err := prog.EmitWithPluginTransformers(transforms, writeFile)
	profileBuildStep(profile, "emit-total", started)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: emit failed: %v\n", err)
		return 3
	}
	if len(transformDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, transformDiags, cwd)
		return 3
	}
	emitHasError := false
	for _, d := range eDiags {
		fmt.Fprintln(stderr, "  -", d.String())
		if d.IsError() {
			emitHasError = true
		}
	}
	if emitHasError {
		return 3
	}
	if *manifestPath != "" {
		data, err := json.Marshal(emitted)
		if err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia build: manifest marshal failed: %v\n", err)
			return 3
		}
		if err := os.MkdirAll(filepath.Dir(*manifestPath), 0o755); err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia build: manifest mkdir failed: %v\n", err)
			return 3
		}
		if err := os.WriteFile(*manifestPath, data, 0o644); err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia build: manifest write failed: %v\n", err)
			return 3
		}
	}
	if !*quiet {
		fmt.Fprintf(stdout, "// ttsc-nestia build: emitted=%d files\n", len(emitted))
	}
	profileBuildStep(profile, "total", totalStarted)
	return 0
}

// emitDeclarations runs tsgo's standard declaration emitter for the program.
// tsgo's MarkLinkedReferences pass can nil-panic on some cross-module reference
// shapes (e.g. a nestia.config.ts that calls NestFactory.create, compiled by the
// SDK config loader only to be require()d). The .js the caller needs is emitted
// separately by EmitWithPluginTransformers, so recover and skip the .d.ts for
// this run instead of aborting the whole build.
func emitDeclarations(prog *driver.Program, writeFile shimcompiler.WriteFile) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Fprintf(stderr, "ttsc-nestia build: declaration emit skipped (%v)\n", r)
		}
	}()
	dts := prog.TSProgram.Emit(context.Background(), shimcompiler.EmitOptions{
		EmitOnly:  shimcompiler.EmitOnlyDts,
		WriteFile: writeFile,
	})
	if dts != nil && dts.EmitSkipped {
		fmt.Fprintln(stderr, "ttsc-nestia build: declaration emit skipped")
	}
}

func runCheck(args []string) int {
	fs := flag.NewFlagSet("check", flag.ContinueOnError)
	fs.SetOutput(stderr)
	tsconfigPath := fs.String("tsconfig", "tsconfig.json", "path to tsconfig.json")
	cwdOverride := fs.String("cwd", "", "override the working directory")
	pluginsJSON := fs.String("plugins-json", "", "ordered ttsc plugin payload")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if _, err := plugin.ParsePlan(*pluginsJSON); err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia check: %v\n", err)
		return 2
	}
	cwd, ok := resolveCWD("ttsc-nestia check", *cwdOverride)
	if !ok {
		return 2
	}
	prog, diags, err := driver.LoadProgram(cwd, *tsconfigPath, driver.LoadProgramOptions{
		ForceNoEmit: true,
	})
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia check: %v\n", err)
		return 2
	}
	if len(diags) > 0 {
		driver.WritePrettyDiagnostics(stderr, diags, cwd)
		return 2
	}
	defer prog.Close()
	if diags := prog.Diagnostics(); len(diags) > 0 {
		driver.WritePrettyDiagnostics(stderr, diags, cwd)
		return 2
	}
	return 0
}

type Diagnostic struct {
	File    string
	Line    int
	Column  int
	Code    string
	Message string
}

func (d Diagnostic) String(cwd string) string {
	file := d.File
	if rel, err := filepath.Rel(cwd, file); err == nil {
		file = rel
	}
	if d.Line > 0 {
		return fmt.Sprintf("%s:%d:%d - error TS(%s): %s", file, d.Line, d.Column, d.Code, d.Message)
	}
	return fmt.Sprintf("%s - error TS(%s): %s", file, d.Code, d.Message)
}

func WriteTypiaTransformDiagnostics(out io.Writer, diagnostics []Diagnostic, cwd string) {
	for _, diag := range diagnostics {
		fmt.Fprintln(out, diag.String(cwd))
	}
}

func profileBuildStep(enabled bool, name string, started time.Time) {
	if enabled {
		profileBuildDuration(enabled, name, time.Since(started))
	}
}
func profileBuildDuration(enabled bool, name string, elapsed time.Duration) {
	if enabled {
		fmt.Fprintf(stderr, "ttsc-nestia profile: %s=%s\n", name, elapsed)
	}
}
func readTypiaPluginOptions(cwd, tsconfigPath string) typiaadapter.PluginOptions {
	path := tsconfigPath
	if !filepath.IsAbs(path) {
		path = filepath.Join(cwd, path)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return typiaadapter.PluginOptions{}
	}
	text := string(data)
	return typiaadapter.PluginOptions{
		Functional: typiaOptionFunctionalPattern.MatchString(text),
		Numeric:    typiaOptionNumericPattern.MatchString(text),
		Finite:     typiaOptionFinitePattern.MatchString(text),
		Undefined:  readBooleanPluginOption(text, "undefined"),
	}
}

func readBooleanPluginOption(text string, name string) *bool {
	matched := regexp.MustCompile(`(?s)"` + regexp.QuoteMeta(name) + `"\s*:\s*(true|false)`).FindStringSubmatch(text)
	if matched == nil {
		return nil
	}
	value := matched[1] == "true"
	return &value
}

var (
	typiaOptionFunctionalPattern = regexp.MustCompile(`(?s)"functional"\s*:\s*true`)
	typiaOptionNumericPattern    = regexp.MustCompile(`(?s)"numeric"\s*:\s*true`)
	typiaOptionFinitePattern     = regexp.MustCompile(`(?s)"finite"\s*:\s*true`)
)

func resolveCWD(label string, cwdOverride string) (string, bool) {
	if cwdOverride != "" {
		return cwdOverride, true
	}
	cwd, err := os.Getwd()
	if err != nil {
		fmt.Fprintf(stderr, "%s: cwd: %v\n", label, err)
		return "", false
	}
	return cwd, true
}
