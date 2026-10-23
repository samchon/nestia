package transform

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	shimcompiler "github.com/microsoft/typescript-go/shim/compiler"
	shimtspath "github.com/microsoft/typescript-go/shim/tspath"
	"github.com/samchon/nestia/packages/core/native/plugin"
	"github.com/samchon/ttsc/packages/ttsc/driver"
)

// TestDistinctProgramsConcurrentEmit verifies separate Programs own their emitted
// validators and query serializers during overlapping emission.
//
// The transform's private per-file constructors must share the emit factory,
// never a package-global arena. Same-package access keeps this in-process test
// on the actual composed pipeline without exposing a product API for testing.
//
// 1. Load two Programs with distinct markers, body validators and query routes.
// 2. Establish serial controls for every query serializer mode, including null.
// 3. Emit sixteen times per Program concurrently and compare every output.
//
// @evidence contracts/testing.md#behavioral-verification The real typia and core PluginTransforms run through EmitWithPluginTransformers. Generated string guards, URLSearchParams serializers, untouched authored values and Program-specific markers are required before parallel byte comparisons; -race detects shared mutable arenas.
// @evidence contracts/testing.md#independent-expectations Authored string, array and optional query fields require validation and URLSearchParams serialization under the public decorator contract. Null disables serialization. Serial equality proves repeatability only; explicit generated guards prevent untransformed output from satisfying the oracle.
// @evidence contracts/testing.md#distinguishing-cases Assert, is, validate and plain query serialization plus null exercise mode selection. Optional nullable scalars, optional nullable arrays, nested body objects and foreign decorator controls cover branch boundaries. Distinct markers reject cross-Program contamination; the serial control separates semantic failures from concurrency failures.
// @evidence contracts/testing.md#execution-ownership The canonical Go runner explicitly includes this same-package native test because private transform constructors are required. It loads Programs in-process without building a host or running JavaScript. Each worker owns one Program; cleanup closes Programs before removing fixture roots.
func TestDistinctProgramsConcurrentEmit(t *testing.T) {
	for _, mode := range []string{"assert", "is", "validate", "stringify", "null"} {
		t.Run(mode, func(t *testing.T) {
			programs := make([]*driver.Program, 2)
			for index := range programs {
				root, err := os.MkdirTemp(filepath.Join("..", "..", "node_modules"), "nestia-concurrent-")
				if err != nil {
					t.Fatal(err)
				}
				root, err = filepath.Abs(root)
				if err != nil {
					t.Fatal(err)
				}
				t.Cleanup(func() {
					if err := os.RemoveAll(root); err != nil {
						t.Error(err)
					}
				})
				core := filepath.Join(root, "node_modules", "@nestia", "core")
				if err := os.MkdirAll(core, 0o755); err != nil {
					t.Fatal(err)
				}
				for name, text := range map[string]string{
					filepath.Join(root, "package.json"): `{"name":"concurrent-emit-fixture","private":true}`,
					filepath.Join(core, "package.json"): `{"name":"@nestia/core","types":"index.d.ts"}`,
					filepath.Join(core, "index.d.ts"): `export function TypedBody(): ParameterDecorator;
export function TypedQuery(): ParameterDecorator;
export namespace TypedQuery { function Get(): MethodDecorator; }
export namespace TypedRoute { function Get(): MethodDecorator; }`,
					filepath.Join(root, "tsconfig.json"): `{"compilerOptions":{"target":"es2022","module":"nodenext","moduleResolution":"nodenext","experimentalDecorators":true,"strict":true,"skipLibCheck":true,"types":[],"rootDir":".","outDir":"out"},"files":["index.ts"]}`,
					filepath.Join(root, "index.ts"): fmt.Sprintf(`import { TypedBody, TypedQuery, TypedRoute } from "@nestia/core";
import typia from "typia";
type Query = { name: string; count?: number | null; values?: number[] | null };
type Body = { name: string; rows: { value: number }[]; nested?: { enabled: boolean } };
const Foreign = (): MethodDecorator => () => {};
export const owner = %q;
export const untouched = "unchanged";
export const check = typia.createAssert<Body>();
export class Controller {
  @TypedQuery.Get()
  query(@TypedQuery() input: Query): Query { return input; }
  @TypedRoute.Get()
  body(@TypedBody() input: Body): Body { return input; }
  @Foreign()
  plain(): string { return "foreign"; }
}`, fmt.Sprintf("program-%d", index)),
				} {
					if err := os.WriteFile(name, []byte(text), 0o644); err != nil {
						t.Fatal(err)
					}
				}
				program, diagnostics, err := driver.LoadProgram(root, "tsconfig.json", driver.LoadProgramOptions{ForceEmit: true})
				if program != nil {
					t.Cleanup(func() {
						if err := program.Close(); err != nil {
							t.Error(err)
						}
					})
				}
				if err != nil || driver.CountErrors(diagnostics) != 0 {
					t.Fatalf("load: %v; %+v", err, diagnostics)
				}
				if diagnostics := program.Diagnostics(); driver.CountErrors(diagnostics) != 0 {
					t.Fatalf("typecheck: %+v", diagnostics)
				}
				programs[index] = program
			}
			emit := func(index int) (string, error) {
				program := programs[index]
				release := registerTypiaDefaultLibraryClassifier(program)
				defer release()
				value := fmt.Sprintf("%q", mode)
				if mode == "null" {
					value = "null"
				}
				plan, err := plugin.ParsePlan(`[{"name":"typia","config":{"transform":"typia/lib/transform"}},{"name":"@nestia/core","config":{"transform":"@nestia/core/lib/transform","stringify":` + value + `}}]`)
				if err != nil {
					return "", err
				}
				var diagnostics []Diagnostic
				add := func(d Diagnostic) { diagnostics = append(diagnostics, d) }
				var output string
				diags, err := program.EmitWithPluginTransformers([]driver.PluginTransform{
					nestiaTypiaNodeTransform(program, readTypiaPluginOptions(plan), add),
					nestiaCoreNodeTransform(program, plan, add),
				}, shimcompiler.WriteFile(func(name shimtspath.RootedFilePath, text string, _ *shimcompiler.WriteFileData) error {
					if filepath.Base(string(name)) == "index.js" {
						output = text
					}
					return nil
				}))
				if err != nil || driver.CountErrors(diags) != 0 || len(diagnostics) != 0 {
					return "", fmt.Errorf("emit: %v; %+v; %+v", err, diags, diagnostics)
				}
				for _, required := range []string{fmt.Sprintf("program-%d", index), `"unchanged"`, "Array.isArray", `"string"`, "input.name", "Foreign()"} {
					if !strings.Contains(output, required) {
						return "", fmt.Errorf("missing %q:\n%s", required, output)
					}
				}
				if strings.Contains(output, "const output = new URLSearchParams") != (mode != "null") || strings.Contains(output, "TypedQuery.Get(null)") != (mode == "null") {
					return "", fmt.Errorf("wrong query serialization for %s:\n%s", mode, output)
				}
				if strings.Contains(output, fmt.Sprintf("program-%d", 1-index)) {
					return "", fmt.Errorf("foreign Program marker")
				}
				return output, nil
			}
			controls := make([]string, 2)
			for index := range programs {
				var err error
				controls[index], err = emit(index)
				if err != nil {
					t.Fatal(err)
				}
				t.Logf("%s Program %d serial SHA256: %x", mode, index, sha256.Sum256([]byte(controls[index])))
			}
			start := make(chan struct{})
			failures := make(chan error, 2)
			var workers sync.WaitGroup
			for index := range programs {
				workers.Add(1)
				go func() {
					defer workers.Done()
					<-start
					for range 16 {
						output, err := emit(index)
						if err != nil {
							failures <- err
							return
						}
						if output != controls[index] {
							failures <- fmt.Errorf("Program %d changed emitted bytes", index)
							return
						}
					}
				}()
			}
			close(start)
			workers.Wait()
			close(failures)
			for err := range failures {
				t.Error(err)
			}
		})
	}
}
