package transform

import (

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimprinter "github.com/microsoft/typescript-go/shim/printer"
	shimscanner "github.com/microsoft/typescript-go/shim/scanner"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	typiaadapter "github.com/samchon/typia/packages/typia/native/adapter"
	nativecontext "github.com/samchon/typia/packages/typia/native/core/context"
	nativetransform "github.com/samchon/typia/packages/typia/native/transform"
)

// nestiaTypiaNodeTransform wraps typia's per-file AST transformer as a ttsc
// PluginTransform. typia owns its call-site detection and (in ec mode) injects
// the namespace imports tsgo's module-transform aliases, so @nestia/core simply
// runs it alongside its own decorator transform inside the same emit pipeline.
// A recovered typia transform error is reported as a diagnostic.
func nestiaTypiaNodeTransform(
	prog *driver.Program,
	pluginOptions typiaadapter.PluginOptions,
	addDiagnostic func(Diagnostic),
) driver.PluginTransform {
	transformOptions := pluginOptions.TransformOptions()
	extras := nativecontext.ITypiaContext_Extras{
		AddDiagnostic: func(diag *nativecontext.ITypiaDiagnostic) int {
			addDiagnostic(nestiaTypiaDiagnosticFrom(diag))
			return 1
		},
	}
	return func(ec *shimprinter.EmitContext, sf *shimast.SourceFile) *shimast.SourceFile {
		return nativetransform.Transform(prog, &transformOptions, extras, ec)(sf)
	}
}

func nestiaTypiaDiagnosticFrom(diag *nativecontext.ITypiaDiagnostic) Diagnostic {
	out := Diagnostic{Code: "typia.transform", Message: "typia transform error"}
	if diag == nil {
		return out
	}
	if diag.Code != "" {
		out.Code = diag.Code
	}
	if diag.Message != "" {
		out.Message = diag.Message
	}
	if diag.File != nil {
		out.File = diag.File.FileName()
		if diag.Start != nil && *diag.Start >= 0 {
			line, column := shimscanner.GetECMALineAndByteOffsetOfPosition(diag.File, *diag.Start)
			out.Line = line + 1
			out.Column = column + 1
		}
	}
	return out
}

type nestiaTypiaImportRoot struct {
	module string
}
