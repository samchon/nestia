package transform

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	typiaadapter "github.com/samchon/typia/packages/typia/native/adapter"
)

type transformProjectOutput struct {
	Diagnostics []transformCompilerDiagnostic `json:"diagnostics,omitempty"`
	TypeScript  map[string]string             `json:"typescript"`
}

type transformCompilerDiagnostic struct {
	File        *string `json:"file"`
	Category    string  `json:"category"`
	Code        string  `json:"code"`
	Line        int     `json:"line,omitempty"`
	Character   int     `json:"character,omitempty"`
	MessageText string  `json:"messageText"`
}

func runTransform(args []string) int {
	fs := flag.NewFlagSet("transform", flag.ContinueOnError)
	fs.SetOutput(stderr)
	file := fs.String("file", "", "absolute or cwd-relative path of the .ts file to transform")
	tsconfigPath := fs.String("tsconfig", "tsconfig.json", "tsconfig.json owning --file")
	cwdOverride := fs.String("cwd", "", "override the working directory")
	out := fs.String("out", "", "write output to PATH")
	output := fs.String("output", "ts", "transform output kind: ts")
	pluginsJSON := fs.String("plugins-json", "", "ordered ttsc plugin payload")
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if *output != "ts" {
		fmt.Fprintf(stderr, "ttsc-nestia transform: unknown --output value %q\n", *output)
		return 2
	}
	plan, err := plugin.ParsePlan(*pluginsJSON)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: %v\n", err)
		return 2
	}

	cwd, ok := resolveCWD("ttsc-nestia transform", *cwdOverride)
	if !ok {
		return 2
	}
	prog, diags, err := driver.LoadProgram(cwd, *tsconfigPath, driver.LoadProgramOptions{
		ForceNoEmit: true,
	})
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: %v\n", err)
		return 2
	}
	if len(diags) > 0 {
		driver.WritePrettyDiagnostics(stderr, diags, cwd)
		return 2
	}
	defer prog.Close()

	if *file == "" {
		if *out != "" {
			fmt.Fprintln(stderr, "ttsc-nestia transform: --out requires --file")
			return 2
		}
		return runTransformProject(prog, cwd, *tsconfigPath, plan)
	}

	absFile := *file
	if !filepath.IsAbs(absFile) {
		absFile = filepath.Join(cwd, absFile)
	}
	absFile = filepath.ToSlash(absFile)
	target := prog.SourceFile(absFile)
	if target == nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: source file is not in program: %s\n", absFile)
		return 2
	}
	rewrites, diagnostics := collectTypiaSourceRewrites(
		prog,
		cwd,
		absFile,
		readTypiaPluginOptions(cwd, *tsconfigPath),
	)
	if len(diagnostics) > 0 {
		WriteTypiaTransformDiagnostics(stderr, diagnostics, cwd)
		return 3
	}
	coreRewriteMap, coreDiagnostics := collectNestiaCoreSourceRewriteMap(prog, plan, absFile)
	if len(coreDiagnostics) > 0 {
		WriteTypiaTransformDiagnostics(stderr, coreDiagnostics, cwd)
		return 3
	}
	rewrites = append(rewrites, coreRewriteMap[filepath.ToSlash(absFile)]...)
	contributorRewriteMap, contributorDiagnostics := collectContributorSourceRewriteMap(prog, plan, absFile)
	if len(contributorDiagnostics) > 0 {
		WriteTypiaTransformDiagnostics(stderr, contributorDiagnostics, cwd)
		return 3
	}
	rewrites = append(rewrites, contributorRewriteMap[filepath.ToSlash(absFile)]...)
	source, ok := SourceFileText(target)
	if !ok {
		fmt.Fprintf(stderr, "ttsc-nestia transform: source text is unavailable for %s\n", absFile)
		return 3
	}
	source, err = ApplySourceRewrites(source, rewrites)
	if err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: source rewrite: %v\n", err)
		return 3
	}
	source = cleanupTypeScriptTransformText(source)
	if *out == "" {
		if _, err := bytes.NewBufferString(source).WriteTo(stdout); err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia transform: write stdout: %v\n", err)
			return 3
		}
		return 0
	}
	if dir := filepath.Dir(*out); dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia transform: mkdir: %v\n", err)
			return 3
		}
	}
	if err := os.WriteFile(*out, []byte(source), 0o644); err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: write %s: %v\n", *out, err)
		return 3
	}
	return 0
}

func runTransformProject(prog *driver.Program, cwd string, tsconfigPath string, plan plugin.Plan) int {
	rewrites, diags := collectTypiaSourceRewriteMap(
		prog,
		readTypiaPluginOptions(cwd, tsconfigPath),
	)
	coreRewriteMap, coreDiags := collectNestiaCoreSourceRewriteMap(prog, plan, "")
	for file, entries := range coreRewriteMap {
		rewrites[file] = append(rewrites[file], entries...)
	}
	contributorRewriteMap, contributorDiags := collectContributorSourceRewriteMap(prog, plan, "")
	for file, entries := range contributorRewriteMap {
		rewrites[file] = append(rewrites[file], entries...)
	}
	diags = append(diags, coreDiags...)
	diags = append(diags, contributorDiags...)
	output := transformProjectOutput{
		Diagnostics: make([]transformCompilerDiagnostic, 0, len(diags)),
		TypeScript:  map[string]string{},
	}
	for _, diag := range diags {
		output.Diagnostics = append(output.Diagnostics, transformDiagnosticToCompilerDiagnostic(diag))
	}
	for _, file := range prog.SourceFiles() {
		filename := filepath.ToSlash(file.FileName())
		source, ok := SourceFileText(file)
		if !ok {
			output.Diagnostics = append(
				output.Diagnostics,
				newTransformCompilerDiagnostic(filename, "nestia.transform", "source text is unavailable"),
			)
			continue
		}
		transformed, err := ApplySourceRewrites(source, rewrites[filename])
		if err != nil {
			output.Diagnostics = append(
				output.Diagnostics,
				newTransformCompilerDiagnostic(filename, "typia.transform", err.Error()),
			)
			continue
		}
		output.TypeScript[sourceFileKey(cwd, filename)] = cleanupTypeScriptTransformText(transformed)
	}
	if err := json.NewEncoder(stdout).Encode(output); err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: encode output: %v\n", err)
		return 3
	}
	if len(output.Diagnostics) > 0 {
		return 3
	}
	return 0
}

type SourceRewrite struct {
	start       int
	end         int
	replacement string
}

func collectTypiaSourceRewrites(
	prog *driver.Program,
	cwd string,
	onlyFile string,
	pluginOptions typiaadapter.PluginOptions,
) ([]SourceRewrite, []Diagnostic) {
	sites := collectNestiaTypiaCallSites(prog.SourceFiles(), prog.Checker)
	rewrites := []SourceRewrite{}
	diagnostics := []Diagnostic{}
	for _, site := range sites {
		if filepath.ToSlash(site.FilePath) != filepath.ToSlash(onlyFile) {
			continue
		}
		if reason := typiaadapter.UnsupportedReason(site); reason != "" {
			diagnostics = append(diagnostics, NewDiagnostic(site, reason))
			continue
		}
		expr, handled, err := typiaadapter.EmitCallWithOptionsPreservingTypes(prog, site, pluginOptions)
		if !handled {
			diagnostics = append(diagnostics, NewDiagnostic(site, "method not covered"))
			continue
		}
		if err != nil {
			diagnostics = append(diagnostics, NewDiagnostic(site, err.Error()))
			continue
		}
		expr = parenthesizeTypiaReplacement(site, expr)
		node := site.Call.AsNode()
		rewrites = append(rewrites, SourceRewrite{
			start:       node.Pos(),
			end:         node.End(),
			replacement: expr,
		})
		_ = cwd
	}
	return rewrites, diagnostics
}

func collectTypiaSourceRewriteMap(
	prog *driver.Program,
	pluginOptions typiaadapter.PluginOptions,
) (map[string][]SourceRewrite, []Diagnostic) {
	sites := collectNestiaTypiaCallSites(prog.SourceFiles(), prog.Checker)
	rewrites := map[string][]SourceRewrite{}
	diagnostics := []Diagnostic{}
	for _, site := range sites {
		file := filepath.ToSlash(site.FilePath)
		if reason := typiaadapter.UnsupportedReason(site); reason != "" {
			diagnostics = append(diagnostics, NewDiagnostic(site, reason))
			continue
		}
		expr, handled, err := typiaadapter.EmitCallWithOptionsPreservingTypes(prog, site, pluginOptions)
		if !handled {
			diagnostics = append(diagnostics, NewDiagnostic(site, "method not covered"))
			continue
		}
		if err != nil {
			diagnostics = append(diagnostics, NewDiagnostic(site, err.Error()))
			continue
		}
		expr = parenthesizeTypiaReplacement(site, expr)
		node := site.Call.AsNode()
		rewrites[file] = append(rewrites[file], SourceRewrite{
			start:       node.Pos(),
			end:         node.End(),
			replacement: expr,
		})
	}
	return rewrites, diagnostics
}

func ApplySourceRewrites(source string, rewrites []SourceRewrite) (string, error) {
	sort.SliceStable(rewrites, func(i, j int) bool {
		return rewrites[i].start > rewrites[j].start
	})
	for i := 0; i < len(rewrites)-1; i++ {
		if rewrites[i+1].end > rewrites[i].start {
			return "", fmt.Errorf("overlapping rewrites: [%d,%d) vs [%d,%d)",
				rewrites[i+1].start, rewrites[i+1].end, rewrites[i].start, rewrites[i].end)
		}
	}
	output := source
	for _, rewrite := range rewrites {
		if rewrite.start < 0 || rewrite.end < rewrite.start || rewrite.end > len(output) {
			return "", fmt.Errorf("invalid rewrite range [%d,%d)", rewrite.start, rewrite.end)
		}
		output = output[:rewrite.start] + rewrite.replacement + output[rewrite.end:]
	}
	return output, nil
}

func SourceFileText(target any) (string, bool) {
	type sourceText interface {
		Text() string
	}
	file, ok := target.(sourceText)
	if !ok {
		return "", false
	}
	return file.Text(), true
}

func cleanupTypeScriptTransformText(text string) string {
	text = cleanupTransformedText(text)
	text = normalizeParenthesizedTypeAnnotations(text)
	text = regexp.MustCompile(`(?m)^import type \{([^{}\n]+)\} from`).ReplaceAllStringFunc(text, func(line string) string {
		return regexp.MustCompile(`^import type \{\s*([^{}\n]+?)\s*\} from`).ReplaceAllString(line, "import type { $1 } from")
	})
	text = regexp.MustCompile(`(?m)(^import [^\n]+;\n)\n+(const |let |var |export )`).ReplaceAllString(text, "$1$2")
	text = strings.ReplaceAll(text, "=(() =>", "= (() =>")
	text = strings.ReplaceAll(text, ": (any) =>", ": any =>")
	text = strings.ReplaceAll(text, ": (boolean) =>", ": boolean =>")
	text = regexp.MustCompile(`input is \(([A-Za-z_$][A-Za-z0-9_$.]*)\)`).ReplaceAllString(text, "input is $1")
	text = strings.ReplaceAll(text, "return (success ? ", "return success ? ")
	text = strings.ReplaceAll(text, "}) as any;", "} as any;")
	text = strings.ReplaceAll(text, "(() => {\n    const ", "(() => { const ")
	text = strings.ReplaceAll(text, "(() => {\n    let ", "(() => { let ")
	text = strings.ReplaceAll(text, "(() => {\n    return ", "(() => { return ")
	text = strings.ReplaceAll(text, ";\n    const ", "; const ")
	text = strings.ReplaceAll(text, ";\n    let ", "; let ")
	text = strings.ReplaceAll(text, ";\n    return ", "; return ")
	text = strings.ReplaceAll(text, "\n    };\n})()", "\n}; })()")
	text = strings.ReplaceAll(text, "\n    });\n})()", "\n}); })()")
	text = strings.ReplaceAll(text, "\n    }); let ", "\n}); let ")
	text = strings.ReplaceAll(text, ";\n})()", "; })()")
	text = strings.ReplaceAll(text, "\n        ", "\n    ")
	text = regexp.MustCompile(`\n\n([A-Za-z_$][A-Za-z0-9_$]*\([^;\n]*\);?)`).ReplaceAllString(text, "\n$1")
	trimmed := strings.TrimRight(text, " \t\r\n")
	if strings.HasSuffix(trimmed, ")") && !strings.HasSuffix(trimmed, ";") {
		return trimmed + ";\n"
	}
	if text != "" && !strings.HasSuffix(text, "\n") {
		return text + "\n"
	}
	return text
}

func normalizeParenthesizedTypeAnnotations(text string) string {
	typeAtom := `([A-Za-z_$][A-Za-z0-9_$.]*(<[^()\n;{}]*>)?)`
	text = regexp.MustCompile(`: \(`+typeAtom+`\)(\s*=>)`).ReplaceAllString(text, ": $1$3")
	text = regexp.MustCompile(`\| \((null|undefined)\)`).ReplaceAllString(text, "| $1")
	return text
}

func sourceFileKey(cwd string, file string) string {
	rel, err := filepath.Rel(cwd, filepath.FromSlash(file))
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) {
		return filepath.ToSlash(file)
	}
	return filepath.ToSlash(rel)
}

func newTransformCompilerDiagnostic(
	file string,
	code string,
	message string,
) transformCompilerDiagnostic {
	var ptr *string
	if file != "" {
		normalized := filepath.ToSlash(file)
		ptr = &normalized
	}
	return transformCompilerDiagnostic{
		File:        ptr,
		Category:    "error",
		Code:        code,
		MessageText: message,
	}
}

func transformDiagnosticToCompilerDiagnostic(
	diag Diagnostic,
) transformCompilerDiagnostic {
	var ptr *string
	if diag.File != "" {
		normalized := filepath.ToSlash(diag.File)
		ptr = &normalized
	}
	return transformCompilerDiagnostic{
		File:        ptr,
		Category:    "error",
		Code:        diag.Code,
		Line:        diag.Line,
		Character:   diag.Column,
		MessageText: diag.Message,
	}
}
