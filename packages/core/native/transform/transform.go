package transform

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
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
	// SourceMaps maps each printed TypeScript key whose text differs from the
	// authored text to a version 3 map back to that text, keyed like TypeScript.
	// A file published as its authored text has no entry. `@ttsc/unplugin` hands
	// the map to the bundler only when its `sourcesContent` is the text it read.
	SourceMaps map[string]json.RawMessage `json:"sourceMaps,omitempty"`
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
	// EnvironmentInputs maps each environment variable the host and its linked
	// contributors read through the program's Env to the value read, null when
	// unset, as ttsc's own transform host publishes it. A persistent consumer
	// such as `@ttsc/unplugin` withdraws a transform whose recorded value
	// changed: NESTIA_SDK_TRANSFORM decides whether the SDK metadata pass ran.
	// Omitted when nothing was read.
	EnvironmentInputs map[string]*string `json:"environmentInputs,omitempty"`
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
	// and a changed SourceFile is printed back as TypeScript (no JS script
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
	// typia's and core's transformers report a change by returning a new
	// SourceFile. A contributor may edit the tree in place and return the one it
	// was given, as @nestia/sdk's metadata pass does, so with one active an
	// unchanged pointer proves nothing.
	rebuilding := len(contributorTransforms) == 0

	if *file == "" {
		if *out != "" {
			fmt.Fprintln(stderr, "ttsc-nestia transform: --out requires --file")
			return 2
		}
		return runTransformProject(prog, cwd, transforms, rebuilding, &transformDiags)
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
	text, _ := transformFileToTypeScript(prog, transforms, rebuilding, target)
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
	rebuilding bool,
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
	// reference closure carries -- and this host cannot honor it: whether a file
	// is transformed at all depends on symbol resolutions that no listener
	// reports, including the negative ones, and typia's own trigger set belongs
	// to typia rather than to this host. See samchon/typia#2357.
	collector := newTransformDependencyCollector(cwd, func(fileName string) bool {
		sf := prog.SourceFile(fileName)
		return sf != nil && prog.TSProgram.IsLibFile(sf)
	})
	// `File` alone is the whole listener this host needs. `Callee` falls back
	// to it, and the two channels differ only in whether a default library
	// withholds a completeness declaration, which this host never makes;
	// `Unbounded` is ignorable for the same reason, since an unreported input
	// is still watched through the reference graph.
	schemametadata.MetadataDependency_listen(prog.Checker, schemametadata.MetadataDependency_IListener{
		File: collector.Touch,
	})
	defer schemametadata.MetadataDependency_release(prog.Checker)
	for _, sf := range prog.SourceFiles() {
		if sf.IsDeclarationFile {
			continue
		}
		key := driver.TransformOutputKey(cwd, string(sf.FileName()))
		if filepath.IsAbs(key) || key == ".." || strings.HasPrefix(key, "../") {
			continue
		}
		collector.Begin(key)
		text, sourceMap := transformFileToTypeScript(prog, transforms, rebuilding, sf)
		output.TypeScript[key] = text
		if sourceMap != "" {
			if output.SourceMaps == nil {
				output.SourceMaps = map[string]json.RawMessage{}
			}
			output.SourceMaps[key] = json.RawMessage(sourceMap)
		}
		collector.End()
	}
	output.Dependencies = collector.ToJSON()
	// Contributor collection and every emit above have run, so the ledger holds
	// each read that could have shaped this envelope.
	output.EnvironmentInputs = prog.PluginEnvironmentInputs()
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
// in a fresh EmitContext and returns the file's TypeScript with a source map
// back to the authored text. It deliberately skips the JS script transformers
// (type-erase, module-transform): the caller wants TS, so the namespace imports
// the transformers inject stay as ES imports.
//
// A file no transformer changed comes back as the parsed text itself, with no
// map. Printing it anyway would hand the consumer the author's code in the
// printer's formatting, which a bundler then takes as a changed module and
// serves with lines that no longer match the file on disk; a host that ignores
// input maps, such as Bun's `onLoad`, loses breakpoints in every module.
//
// The original SourceFile coming back proves nothing changed only when every
// transformer rebuilds what it replaces, as rebuilding states, and nothing
// else rewrote the file. A linked ProgramPlugin edits the tree in place, and a
// linked source preamble is inserted into the parsed text, so under either the
// file is printed like a changed one.
//
// A printed file carries a version 3 map back to the authored text, with that
// text as `sourcesContent`, so the consumer can check the map against the text
// it was handed before composing it. The driver moves a preamble-bearing map
// off the preamble; a map it cannot correct is dropped rather than published
// pointing at the wrong lines, and a printed text equal to the authored text
// needs no map.
func transformFileToTypeScript(
	prog *driver.Program,
	transforms []driver.PluginTransform,
	rebuilding bool,
	sf *shimast.SourceFile,
) (string, string) {
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
	if result == sf && rebuilding && prog.SourcePreamble == "" && !prog.HasLinkedProgramPlugins() {
		return sf.Text(), ""
	}
	shimast.SetParentInChildrenUnset(result.AsNode())
	text, sourceMap := shimprinter.EmitSourceFileWithSourceMap(
		shimprinter.PrinterOptions{NewLine: prog.TSProgram.Options().NewLine, InlineSources: true},
		shimprinter.PrintHandlers{},
		ec,
		result,
	)
	authored, corrected, ok := prog.AuthoredSourceMap(sf, sourceMap)
	if !ok || text == authored {
		return text, ""
	}
	return text, corrected
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

// SourceFileText returns the text supplied by a present Text() provider.
// Missing values, including typed nil receivers, and values without Text()
// return empty text and false without invoking a method. Errors from a present
// provider's Text() method propagate to its caller.
//
// @evidence contracts/common.md#principled-implementation Structural Text() support establishes the provider operation, while a guarded reflect nil-identity check establishes that a receiver exists before dispatch. Every nil-capable kind follows the same absent-source rule; non-nil providers return their own text unchanged.
// @evidence contracts/common.md#clear-and-simple-design One structural type assertion, one constant-time receiver-presence check restricted to the kinds for which Go permits IsNil, and one method dispatch separate absent sources from actual provider behavior.
// @evidence contracts/common.md#prohibited-implementation-shortcuts The nil rule applies to all structural providers without compiler-type names or recovery. It does not invoke missing receivers, mutate foreign providers or conceal errors raised by present providers.
// @evidence contracts/common.md#meaningful-documentation The comment states exact absent-value behavior, typed nil receiver treatment and propagation of present-provider errors.
// @evidenceExclude contracts/portability.md#os-neutral-implementation The Text provider is an in-memory structural interface; the helper does not read a native source file.
// @evidence contracts/performance.md#efficient-algorithms Type and nil checks are constant work; obtaining the string has the provider-defined cost.
// @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation does not coordinate equivalent requests; its result is derived from the supplied value or the current command and compiler program.
// @evidence contracts/performance.md#bound-retention-and-release-resources The provider owns source text and the returned string may retain those bytes; no global provider reference is stored.
func SourceFileText(target any) (string, bool) {
	type sourceText interface {
		Text() string
	}
	file, ok := target.(sourceText)
	if !ok {
		return "", false
	}
	value := reflect.ValueOf(file)
	switch value.Kind() {
	case reflect.Chan, reflect.Func, reflect.Interface, reflect.Map, reflect.Pointer, reflect.Slice, reflect.UnsafePointer:
		if value.IsNil() {
			return "", false
		}
	}
	return file.Text(), true
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
