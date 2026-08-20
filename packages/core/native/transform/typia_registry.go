package transform

import (
	shimast "github.com/microsoft/typescript-go/shim/ast"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

// registerTypiaDefaultLibraryClassifier hands typia's metadata analysis the
// program's own default-library classification and returns the release the
// caller defers.
//
// @nestia/core hosts typia's transform rather than reimplementing it, so it
// owes that analysis the same per-program registrations typia's own host
// installs. Runtime-native identity is decided from this classifier: a global is
// the JavaScript built-in only when a runtime authority declares it. With no
// classifier registered the analysis falls back to a `lib.*.d.ts` base-name
// test, and a default library is not recognizable from its file name --
// `libReplacement` points it at `node_modules/@typescript/lib-es2022/index.d.ts`,
// which does not even start with `lib.`, while `lib.d.ts` is an ordinary
// published file name any dependency may use. Without this, the same DTO
// generates one validator through typia's plugin and a different one through
// nestia's host.
//
// The registry is keyed by checker, so the release must run before the program
// closes; otherwise a closed program's checker stays reachable from a
// process-global map.
func registerTypiaDefaultLibraryClassifier(prog *driver.Program) func() {
	if prog == nil || prog.TSProgram == nil {
		return func() {}
	}
	program := prog.TSProgram
	checker := prog.Checker
	schemametadata.MetadataDefaultLibrary_register(checker, func(source *shimast.SourceFile) bool {
		return source != nil && program.IsLibFile(source)
	})
	return func() {
		schemametadata.MetadataDefaultLibrary_release(checker)
	}
}
