package transform

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

type transformProjectOutput struct {
	Diagnostics []transformCompilerDiagnostic `json:"diagnostics,omitempty"`
	TypeScript  map[string]string             `json:"typescript"`
	// Graph is the host-owned reference graph of the loaded program produced by
	// the ttsc driver SDK (driver.NewTransformGraph): direct resolved reference
	// edges, ambient global-scope files, the tsconfig extends chain, and the
	// module-resolution candidates that outrank a selected target. Keys and
	// values share TypeScript's keying through driver.TransformOutputKey, so a
	// consumer joins the sections by key.
	//
	// A bundler erases type-only imports from its own module graph, so without
	// this section nothing tells a persistent filesystem cache that a generated
	// validator depends on the DTO declaration it was generated from, and the
	// cache replays the stale module after the DTO's type changes. Stamping it
	// also moves `@ttsc/unplugin` off the whole-snapshot revalidation path onto
	// its narrow per-file one. Omitted only for a nil or unloaded program, which
	// cannot happen here: LoadProgram failures return before this point.
	Graph *driver.TransformGraph `json:"graph,omitempty"`
	// Dependencies maps each transformed file (same keys as TypeScript) to the
	// source files owning the declarations typia's metadata analysis consulted
	// while generating that file's validators and stringifiers. A consumer
	// unions them with Graph rather than choosing between them, so the list is
	// additive: an omission costs nothing, and narrowing would require the
	// separate `dependenciesComplete` declaration this envelope does not make.
	Dependencies map[string][]string `json:"dependencies,omitempty"`
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
		ForceEmit: true,
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
	releaseTypiaRegistries := registerTypiaDefaultLibraryClassifier(prog)
	defer releaseTypiaRegistries()

	// AST-integration source-to-source: typia's, core's, and any linked
	// contributor's per-file node transformers run inside one shared EmitContext
	// and the result SourceFile is printed back as TypeScript (no JS script
	// transformers), mirroring typia's `transform` subcommand. Injected namespace
	// imports stay as ES imports the caller can type-strip per file.
	transformDiags := []Diagnostic{}
	addDiagnostic := func(diag Diagnostic) {
		transformDiags = append(transformDiags, diag)
	}
	typiaTransform := nestiaTypiaNodeTransform(prog, readTypiaPluginOptions(plan), addDiagnostic)
	coreTransform := nestiaCoreNodeTransform(prog, plan, addDiagnostic)
	contributorTransforms, contributorDiags := collectContributorEmitTransforms(prog, plan)
	if len(contributorDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, contributorDiags, cwd)
		return 3
	}
	transforms := append([]driver.PluginTransform{typiaTransform, coreTransform}, contributorTransforms...)

	if *file == "" {
		if *out != "" {
			fmt.Fprintln(stderr, "ttsc-nestia transform: --out requires --file")
			return 2
		}
		return runTransformProject(prog, cwd, transforms, &transformDiags)
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
	text := transformFileToTypeScript(prog, transforms, target)
	if len(transformDiags) > 0 {
		WriteTypiaTransformDiagnostics(stderr, transformDiags, cwd)
		return 3
	}
	return writeSingleOutput(text, *out)
}

func runTransformProject(
	prog *driver.Program,
	cwd string,
	transforms []driver.PluginTransform,
	transformDiags *[]Diagnostic,
) int {
	output := transformProjectOutput{
		Diagnostics: []transformCompilerDiagnostic{},
		TypeScript:  map[string]string{},
	}
	// Compute the reference graph from the loaded program before the transform
	// loop runs: the graph must describe the original sources' resolved
	// references, which are the transform's inputs, and the loop's printing pass
	// sets parent pointers on the node tree it walks. ttsc's own `api-transform`
	// host stamps it at the same point.
	output.Graph = driver.NewTransformGraph(prog, cwd)
	// `dependencies` is the second, narrower channel: the declaration files
	// typia's analysis actually read for each file, reported alongside the graph
	// rather than instead of it. The two are unioned by the consumer, so this
	// list can only add inputs.
	//
	// The envelope deliberately declares no `dependenciesComplete`. That field
	// transfers responsibility -- a listed file stops watching everything the
	// reference closure carries -- and this host cannot honour it: whether a file
	// is transformed at all depends on symbol resolutions that no listener
	// reports, including the negative ones, and typia's own trigger set belongs
	// to typia rather than to this host. See samchon/typia#2357.
	collector := newTransformDependencyCollector(cwd, func(fileName string) bool {
		sf := prog.SourceFile(fileName)
		return sf != nil && prog.TSProgram.IsLibFile(sf)
	})
	schemametadata.MetadataDependency_listen(prog.Checker, collector.Touch)
	defer schemametadata.MetadataDependency_release(prog.Checker)
	for _, sf := range prog.SourceFiles() {
		if sf.IsDeclarationFile {
			continue
		}
		key := driver.TransformOutputKey(cwd, sf.FileName())
		if filepath.IsAbs(key) || key == ".." || strings.HasPrefix(key, "../") {
			continue
		}
		collector.Begin(key)
		output.TypeScript[key] = transformFileToTypeScript(prog, transforms, sf)
		collector.End()
	}
	output.Dependencies = collector.ToJSON()
	for _, diag := range *transformDiags {
		output.Diagnostics = append(output.Diagnostics, transformDiagnosticToCompilerDiagnostic(diag))
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

// transformFileToTypeScript runs nestia's node transformers on one source file
// in a fresh EmitContext and prints the result as TypeScript. It deliberately
// skips the JS script transformers (type-erase, module-transform): the caller
// wants TS, so the namespace imports the transformers inject stay as ES imports.
func transformFileToTypeScript(
	prog *driver.Program,
	transforms []driver.PluginTransform,
	sf *shimast.SourceFile,
) string {
	options := prog.TSProgram.Options()
	ec := shimprinter.NewEmitContext()
	result := sf
	for _, t := range transforms {
		if t == nil {
			continue
		}
		if next := t(ec, result); next != nil {
			result = next
		}
	}
	shimast.SetParentInChildrenUnset(result.AsNode())
	writer := shimprinter.NewTextWriter(options.NewLine.GetNewLineCharacter(), 0)
	printer := shimprinter.NewPrinter(shimprinter.PrinterOptions{NewLine: options.NewLine}, shimprinter.PrintHandlers{}, ec)
	printer.Write(result.AsNode(), result, writer, nil)
	return writer.String()
}

func writeSingleOutput(text, outPath string) int {
	if outPath == "" {
		if _, err := bytes.NewReader([]byte(text)).WriteTo(stdout); err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia transform: write stdout: %v\n", err)
			return 3
		}
		return 0
	}
	if dir := filepath.Dir(outPath); dir != "" {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			fmt.Fprintf(stderr, "ttsc-nestia transform: mkdir: %v\n", err)
			return 3
		}
	}
	if err := os.WriteFile(outPath, []byte(text), 0o644); err != nil {
		fmt.Fprintf(stderr, "ttsc-nestia transform: write %s: %v\n", outPath, err)
		return 3
	}
	return 0
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

// These patterns run once per transformed file in cleanupTypeScriptTransformText
// / normalizeParenthesizedTypeAnnotations. Compiling them at package scope keeps
// the per-file cost to a match instead of a recompile (the SDK `transform` path
// runs this for every emitted source file).
var (
	cleanupImportTypeBlockPattern   = regexp.MustCompile(`(?m)^import type \{([^{}\n]+)\} from`)
	cleanupImportTypeLinePattern    = regexp.MustCompile(`^import type \{\s*([^{}\n]+?)\s*\} from`)
	cleanupImportBlankLinePattern   = regexp.MustCompile(`(?m)(^import [^\n]+;\n)\n+(const |let |var |export )`)
	cleanupInputIsParenPattern      = regexp.MustCompile(`input is \(([A-Za-z_$][A-Za-z0-9_$.]*)\)`)
	cleanupCollapseBlankCallPattern = regexp.MustCompile(`\n\n([A-Za-z_$][A-Za-z0-9_$]*\([^;\n]*\);?)`)
)
var (
	normalizeParenArrowTypePattern = regexp.MustCompile(`: \(([A-Za-z_$][A-Za-z0-9_$.]*(<[^()\n;{}]*>)?)\)(\s*=>)`)
	normalizeParenNullishPattern   = regexp.MustCompile(`\| \((null|undefined)\)`)
)

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
