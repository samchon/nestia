package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"

	shimcompiler "github.com/microsoft/typescript-go/shim/compiler"
	shimscanner "github.com/microsoft/typescript-go/shim/scanner"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	typiaadapter "github.com/samchon/typia/packages/typia/native/adapter"
)

func runBuild(args []string) int {
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
	prog, diags, err := driver.LoadProgram(cwd, *tsconfigPath, driver.LoadProgramOptions{
		ForceEmit:   *emit,
		ForceNoEmit: *noEmit,
		OutDir:      *outDir,
	})
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: %v\n", err)
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
	sites, recognized, transformDiags := collectTypiaRewrites(
		prog,
		cwd,
		shouldEmit,
		*quiet,
		"",
		rewrites,
		readTypiaPluginOptions(cwd, *tsconfigPath),
	)
	if len(transformDiags) > 0 {
		writeTypiaTransformDiagnostics(stderr, transformDiags, cwd)
		return 3
	}
	if coreDiags := collectNestiaCoreBuildRewrites(prog, plan, rewrites); len(coreDiags) > 0 {
		writeTypiaTransformDiagnostics(stderr, coreDiags, cwd)
		return 3
	}
	sdkRewrites, sdkDiags := collectNestiaSDKBuildRewrites(prog, plan)
	if len(sdkDiags) > 0 {
		writeTypiaTransformDiagnostics(stderr, sdkDiags, cwd)
		return 3
	}
	newPathsRewriter(prog).applyAll(prog.SourceFiles())

	cursors := map[string]int{}
	writeFile := shimcompiler.WriteFile(func(fileName, text string, data *shimcompiler.WriteFileData) error {
		_ = data
		patched, err := rewrites.Apply(fileName, text, cursors)
		if err != nil {
			return err
		}
		patched, err = sdkRewrites.Apply(fileName, patched)
		if err != nil {
			return err
		}
		patched = typiaadapter.CleanupTransformedText(patched)
		return driver.DefaultWriteFile(fileName, patched)
	})
	res, eDiags, err := prog.EmitAllRaw(writeFile)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia build: emit failed: %v\n", err)
		return 3
	}
	for _, d := range eDiags {
		fmt.Fprintln(stderr, "  -", d.String())
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

type typiaTransformDiagnostic struct {
	File    string
	Line    int
	Column  int
	Code    string
	Message string
}

func (d typiaTransformDiagnostic) String(cwd string) string {
	file := d.File
	if rel, err := filepath.Rel(cwd, file); err == nil {
		file = rel
	}
	if d.Line > 0 {
		return fmt.Sprintf("%s:%d:%d - error TS(%s): %s", file, d.Line, d.Column, d.Code, d.Message)
	}
	return fmt.Sprintf("%s - error TS(%s): %s", file, d.Code, d.Message)
}

func writeTypiaTransformDiagnostics(out io.Writer, diagnostics []typiaTransformDiagnostic, cwd string) {
	for _, diag := range diagnostics {
		fmt.Fprintln(out, diag.String(cwd))
	}
}

func newTypiaTransformDiagnostic(site typiaadapter.CallSite, message string) typiaTransformDiagnostic {
	line, column := 0, 0
	if site.File != nil && site.Call != nil {
		pos := site.Call.AsNode().Pos()
		if pos >= 0 {
			l, c := shimscanner.GetECMALineAndByteOffsetOfPosition(site.File, pos)
			line, column = l+1, c+1
		}
	}
	return typiaTransformDiagnostic{
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
) (int, int, []typiaTransformDiagnostic) {
	sites := typiaadapter.CollectCallSites(prog.SourceFiles(), prog.Checker)
	recognized := 0
	diagnostics := []typiaTransformDiagnostic{}
	for _, site := range sites {
		if onlyFile != "" && filepath.ToSlash(site.FilePath) != filepath.ToSlash(onlyFile) {
			continue
		}
		rel := site.FilePath
		if abs, err := filepath.Rel(cwd, rel); err == nil {
			rel = abs
		}
		if reason := typiaadapter.UnsupportedReason(site); reason != "" {
			diagnostics = append(diagnostics, newTypiaTransformDiagnostic(site, reason))
			continue
		}
		expr, handled, err := typiaadapter.EmitCallWithOptions(prog, site, pluginOptions)
		if !handled {
			diagnostics = append(diagnostics, newTypiaTransformDiagnostic(site, "method not covered"))
			continue
		}
		if err != nil {
			diagnostics = append(diagnostics, newTypiaTransformDiagnostic(site, err.Error()))
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
			SourceStart:   site.Call.AsNode().Pos(),
		})
		if !emit && !quiet {
			fmt.Fprintf(stdout, "%s: typia.%s<T> -> %s\n", rel, site.Method, expr)
		}
		recognized++
	}
	return len(sites), recognized, diagnostics
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
