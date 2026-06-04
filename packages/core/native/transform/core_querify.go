package transform

import (
	"fmt"

	shimast "github.com/microsoft/typescript-go/shim/ast"
	shimchecker "github.com/microsoft/typescript-go/shim/checker"
	"github.com/samchon/ttsc/packages/ttsc/driver"
	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	nativeprogrammers "github.com/samchon/typia/packages/typia/native/core/programmers"
	nativehttp "github.com/samchon/typia/packages/typia/native/core/programmers/http"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

func nestiaCoreHttpQuerifyProgrammer(prog *driver.Program, typ *shimchecker.Type) *shimast.Node {
	collection := schemametadata.NewMetadataCollection()
	result := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: prog.Checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   false,
			Constant: true,
			Absorb:   true,
			Validate: func(next struct {
				Metadata *schemametadata.MetadataSchema
				Explore  nativefactories.MetadataFactory_IExplore
				Top      *schemametadata.MetadataSchema
			}) []string {
				return nativehttp.HttpQueryProgrammer.Validate(struct {
					Metadata      *schemametadata.MetadataSchema
					Explore       nativefactories.MetadataFactory_IExplore
					Top           *schemametadata.MetadataSchema
					AllowOptional bool
				}{
					Metadata:      next.Metadata,
					Explore:       next.Explore,
					Top:           next.Top,
					AllowOptional: false,
				})
			},
		},
		Components: collection,
		Type:       typ,
	})
	if result.Success == false {
		panic(fmt.Errorf("failed to analyze query-string metadata: %d error(s)", len(result.Errors)))
	}
	statements := []*shimast.Node{
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name: "output",
			Value: nestiaCoreFactory.NewNewExpression(
				nestiaCoreFactory.NewIdentifier("URLSearchParams"),
				nil,
				nestiaCoreFactory.NewNodeList([]*shimast.Node{}),
			),
		}),
	}
	if result.Data != nil && len(result.Data.Objects) != 0 && result.Data.Objects[0] != nil && result.Data.Objects[0].Type != nil {
		for _, property := range result.Data.Objects[0].Type.Properties {
			key, ok := nestiaCorePropertyStringKey(property)
			if ok == false || property == nil || property.Value == nil {
				continue
			}
			statements = append(statements, nestiaCoreFactory.NewExpressionStatement(
				nestiaCoreHttpQuerifyDecode(key, property.Value),
			))
		}
	}
	statements = append(statements, nestiaCoreFactory.NewReturnStatement(nestiaCoreFactory.NewIdentifier("output")))
	return nestiaCoreFactory.NewArrowFunction(
		nil,
		nil,
		nestiaCoreFactory.NewNodeList([]*shimast.Node{
			nativefactories.IdentifierFactory.Parameter("input", nil, nil),
		}),
		nil,
		nil,
		nestiaCoreFactory.NewToken(shimast.KindEqualsGreaterThanToken),
		nestiaCoreFactory.NewBlock(nestiaCoreFactory.NewNodeList(statements), true),
	)
}

func nestiaCoreHttpAssertQuerifyProgrammer(prog *driver.Program, importer *nativeprogrammers.ImportProgrammer, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, importer, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	return nestiaCoreQueryWrapperArrow([]*shimast.Node{
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name: "assert",
			Value: nativeprogrammers.AssertProgrammer.Write(nativeprogrammers.AssertProgrammer_IProps{
				Context: context,
				Modulo:  modulo,
				Type:    typ,
				Name:    name,
				Config:  nativeprogrammers.AssertProgrammer_IConfig{Equals: false, Guard: false},
			}),
		}),
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name:  "stringify",
			Value: nestiaCoreHttpQuerifyProgrammer(prog, typ),
		}),
		nestiaCoreFactory.NewReturnStatement(nestiaCoreCall("stringify", nestiaCoreCall("assert", nestiaCoreFactory.NewIdentifier("input")))),
	})
}

func nestiaCoreHttpIsQuerifyProgrammer(prog *driver.Program, importer *nativeprogrammers.ImportProgrammer, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, importer, false, false, false)
	name := nestiaCoreTypeName(prog, typ)
	return nestiaCoreQueryWrapperArrow([]*shimast.Node{
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name: "is",
			Value: nativeprogrammers.IsProgrammer.Write(nativeprogrammers.IsProgrammer_IProps{
				Context: context,
				Modulo:  modulo,
				Type:    typ,
				Name:    name,
				Config:  nativeprogrammers.IsProgrammer_IConfig{Equals: false},
			}),
		}),
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name:  "stringify",
			Value: nestiaCoreHttpQuerifyProgrammer(prog, typ),
		}),
		nestiaCoreFactory.NewReturnStatement(nestiaCoreFactory.NewConditionalExpression(
			nestiaCoreCall("is", nestiaCoreFactory.NewIdentifier("input")),
			nil,
			nestiaCoreCall("stringify", nestiaCoreFactory.NewIdentifier("input")),
			nil,
			nestiaCoreFactory.NewKeywordExpression(shimast.KindNullKeyword),
		)),
	})
}

func nestiaCoreHttpValidateQuerifyProgrammer(prog *driver.Program, importer *nativeprogrammers.ImportProgrammer, modulo *shimast.Node, typ *shimchecker.Type) *shimast.Node {
	context := nestiaCoreTypiaContext(prog, importer, true, false, false)
	name := nestiaCoreTypeName(prog, typ)
	return nestiaCoreQueryWrapperArrow([]*shimast.Node{
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name: "validate",
			Value: nativeprogrammers.ValidateProgrammer.Write(nativeprogrammers.ValidateProgrammer_IProps{
				Context: context,
				Modulo:  modulo,
				Type:    typ,
				Name:    name,
				Config:  nativeprogrammers.ValidateProgrammer_IConfig{Equals: false},
			}),
		}),
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name:  "query",
			Value: nestiaCoreHttpQuerifyProgrammer(prog, typ),
		}),
		nativefactories.StatementFactory.Constant(nativefactories.StatementFactory_ConstantProps{
			Name:  "output",
			Value: nestiaCoreCall("query", nestiaCoreFactory.NewIdentifier("input")),
		}),
		nestiaCoreFactory.NewReturnStatement(nestiaCoreFactory.NewAsExpression(
			nestiaCoreCall("validate", nestiaCoreFactory.NewIdentifier("output")),
			nativefactories.TypeFactory.Keyword("any"),
		)),
	})
}

func nestiaCoreQueryWrapperArrow(statements []*shimast.Node) *shimast.Node {
	return nestiaCoreFactory.NewArrowFunction(
		nil,
		nil,
		nestiaCoreFactory.NewNodeList([]*shimast.Node{
			nativefactories.IdentifierFactory.Parameter("input", nil, nil),
		}),
		nil,
		nil,
		nestiaCoreFactory.NewToken(shimast.KindEqualsGreaterThanToken),
		nestiaCoreFactory.NewBlock(nestiaCoreFactory.NewNodeList(statements), true),
	)
}

func nestiaCoreHttpQuerifyDecode(key string, value *schemametadata.MetadataSchema) *shimast.Node {
	if len(value.Arrays) != 0 {
		return nestiaCoreFactory.NewCallExpression(
			nativefactories.IdentifierFactory.Access(
				nativefactories.IdentifierFactory.Access(nestiaCoreFactory.NewIdentifier("input"), key),
				"forEach",
			),
			nil,
			nil,
			nestiaCoreFactory.NewNodeList([]*shimast.Node{
				nestiaCoreFactory.NewArrowFunction(
					nil,
					nil,
					nestiaCoreFactory.NewNodeList([]*shimast.Node{
						nativefactories.IdentifierFactory.Parameter("elem", nil, nil),
					}),
					nil,
					nil,
					nestiaCoreFactory.NewToken(shimast.KindEqualsGreaterThanToken),
					nestiaCoreHttpQuerifyAppend(key, nestiaCoreFactory.NewIdentifier("elem")),
				),
			}),
			shimast.NodeFlagsNone,
		)
	}
	return nestiaCoreHttpQuerifyAppend(
		key,
		nativefactories.IdentifierFactory.Access(nestiaCoreFactory.NewIdentifier("input"), key),
	)
}

func nestiaCoreHttpQuerifyAppend(key string, elem *shimast.Node) *shimast.Node {
	return nestiaCoreFactory.NewCallExpression(
		nativefactories.IdentifierFactory.Access(nestiaCoreFactory.NewIdentifier("output"), "append"),
		nil,
		nil,
		nestiaCoreFactory.NewNodeList([]*shimast.Node{
			nestiaCoreFactory.NewStringLiteral(key, shimast.TokenFlagsNone),
			elem,
		}),
		shimast.NodeFlagsNone,
	)
}

func nestiaCoreCall(name string, args ...*shimast.Node) *shimast.Node {
	return nestiaCoreFactory.NewCallExpression(
		nestiaCoreFactory.NewIdentifier(name),
		nil,
		nil,
		nestiaCoreFactory.NewNodeList(args),
		shimast.NodeFlagsNone,
	)
}
