package transform

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"time"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimcompiler "github.com/microsoft/typescript-go/shim/compiler"
	shimscanner "github.com/microsoft/typescript-go/shim/scanner"
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

	rewrites := newNativeRewriteSet()
	if profile {
		started = time.Now()
	}
	sites, recognized, transformDiags := collectTypiaRewrites(
		prog,
		cwd,
		shouldEmit,
		*quiet,
		"",
		rewrites,
		readTypiaPluginOptions(cwd, *tsconfigPath),
	)
	profileBuildStepCount(profile, "typia-rewrites", started, rewrites.Len())
	if len(transformDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, transformDiags, cwd)
		return 3
	}
	beforeCore := rewrites.Len()
	if profile {
		started = time.Now()
	}
	coreDiags := collectNestiaCoreBuildRewrites(prog, plan, rewrites)
	profileBuildStepCount(profile, "core-rewrites", started, rewrites.Len()-beforeCore)
	if len(coreDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, coreDiags, cwd)
		return 3
	}
	if profile {
		started = time.Now()
	}
	contributorRewriters, contributorDiags := collectContributorBuildOutputRewriters(prog, plan)
	contributorCount := 0
	for _, rewriter := range contributorRewriters {
		if rewriter.Len != nil {
			contributorCount += rewriter.Len()
		}
	}
	profileBuildStepCount(profile, "contributor-rewrites", started, contributorCount)
	if len(contributorDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, contributorDiags, cwd)
		return 3
	}
	if profile {
		started = time.Now()
	}
	newPathsRewriter(prog).applyAll(prog.SourceFiles())
	profileBuildStep(profile, "paths-rewrite", started)

	cursors := map[string]int{}
	var nativePatchElapsed time.Duration
	var cleanupElapsed time.Duration
	var writeElapsed time.Duration
	writeFile := shimcompiler.WriteFile(func(fileName, text string, data *shimcompiler.WriteFileData) error {
		_ = data
		var patchStarted time.Time
		if profile {
			patchStarted = time.Now()
		}
		patched, err := rewrites.Apply(fileName, text, cursors)
		if profile {
			nativePatchElapsed += time.Since(patchStarted)
		}
		if err != nil {
			return err
		}
		for _, rewriter := range contributorRewriters {
			if rewriter.Apply == nil {
				continue
			}
			patched, err = rewriter.Apply(fileName, patched)
			if err != nil {
				return err
			}
		}
		if profile {
			patchStarted = time.Now()
		}
		patched = cleanupTransformedTextWithRuntimeAliases(patched, rewrites.RuntimeAliasesForOutput(fileName))
		if profile {
			cleanupElapsed += time.Since(patchStarted)
			patchStarted = time.Now()
			defer func() {
				writeElapsed += time.Since(patchStarted)
			}()
		}
		return driver.DefaultWriteFile(fileName, patched)
	})
	if profile {
		started = time.Now()
	}
	res, eDiags, err := prog.EmitAllRaw(writeFile)
	profileBuildStep(profile, "emit-total", started)
	profileBuildDuration(profile, "emit-native-patch", nativePatchElapsed)
	profileBuildDuration(profile, "emit-cleanup", cleanupElapsed)
	profileBuildDuration(profile, "emit-write", writeElapsed)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: emit failed: %v\n", err)
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
		data, err := json.Marshal(res.EmittedFiles)
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
		fmt.Fprintf(stdout, "// ttsc-nestia build: typia recognized=%d total=%d rewrites=%d\n", recognized, sites, rewrites.Len())
	}
	profileBuildStep(profile, "total", totalStarted)
	return 0
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

func profileBuildStepCount(enabled bool, name string, started time.Time, count int) {
	if enabled {
		fmt.Fprintf(stderr, "ttsc-nestia profile: %s=%s count=%d\n", name, time.Since(started), count)
	}
}

func profileBuildDuration(enabled bool, name string, elapsed time.Duration) {
	if enabled {
		fmt.Fprintf(stderr, "ttsc-nestia profile: %s=%s\n", name, elapsed)
	}
}

func NewDiagnostic(site typiaadapter.CallSite, message string) Diagnostic {
	line, column := 0, 0
	if site.File != nil && site.Call != nil {
		pos := site.Call.AsNode().Pos()
		if pos >= 0 {
			l, c := shimscanner.GetECMALineAndByteOffsetOfPosition(site.File, pos)
			line, column = l+1, c+1
		}
	}
	return Diagnostic{
		File:    site.FilePath,
		Line:    line,
		Column:  column,
		Code:    "typia." + site.Module + "." + site.Method,
		Message: message,
	}
}

func collectTypiaRewrites(
	prog *driver.Program,
	cwd string,
	emit bool,
	quiet bool,
	onlyFile string,
	rewrites *nativeRewriteSet,
	pluginOptions typiaadapter.PluginOptions,
) (int, int, []Diagnostic) {
	sites := collectNestiaTypiaCallSites(prog.SourceFiles(), prog.Checker)
	recognized := 0
	diagnostics := []Diagnostic{}
	for _, site := range sites {
		if onlyFile != "" && filepath.ToSlash(site.FilePath) != filepath.ToSlash(onlyFile) {
			continue
		}
		rel := site.FilePath
		if abs, err := filepath.Rel(cwd, rel); err == nil {
			rel = abs
		}
		if reason := typiaadapter.UnsupportedReason(site); reason != "" {
			diagnostics = append(diagnostics, NewDiagnostic(site, reason))
			continue
		}
		expr, handled, err := typiaadapter.EmitCallWithOptions(prog, site, pluginOptions)
		if !handled {
			diagnostics = append(diagnostics, NewDiagnostic(site, "method not covered"))
			continue
		}
		if err != nil {
			diagnostics = append(diagnostics, NewDiagnostic(site, err.Error()))
			continue
		}
		expr = parenthesizeTypiaReplacement(site, expr)
		rewrites.Add(nativeRewrite{
			FilePath:      site.FilePath,
			RootName:      site.RootName,
			Namespaces:    site.Namespaces,
			Method:        site.Method,
			Replacement:   expr,
			ConsumeParens: true,
			SourceStart:   typiaBuildRewriteSortKey(site),
		})
		if !emit && !quiet {
			fmt.Fprintf(stdout, "%s: typia.%s<T> -> %s\n", rel, site.Method, expr)
		}
		recognized++
	}
	return len(sites), recognized, diagnostics
}

func typiaBuildRewriteSortKey(site typiaadapter.CallSite) int {
	node := site.Call.AsNode()
	if node == nil {
		return 0
	}
	insideDecorator := false
	classEnd := 0
	for current := node.Parent; current != nil; current = current.Parent {
		if current.Kind == NestiaCoreKindDecorator {
			insideDecorator = true
		}
		if current.Kind == shimast.KindClassDeclaration || current.Kind == shimast.KindClassExpression {
			classEnd = current.End()
			break
		}
	}
	if insideDecorator == false {
		return node.Pos()
	}
	if classEnd != 0 {
		return classEnd + node.Pos()
	}
	return node.Pos() + 1_000_000_000
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
		Functional: regexp.MustCompile(`(?s)"functional"\s*:\s*true`).MatchString(text),
		Numeric:    regexp.MustCompile(`(?s)"numeric"\s*:\s*true`).MatchString(text),
		Finite:     regexp.MustCompile(`(?s)"finite"\s*:\s*true`).MatchString(text),
		Undefined:  regexp.MustCompile(`(?s)"undefined"\s*:\s*true`).MatchString(text),
	}
}

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
