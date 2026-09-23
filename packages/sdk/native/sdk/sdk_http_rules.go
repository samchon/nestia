package sdk

import (
	"encoding/json"
	"regexp"

	shimchecker "github.com/microsoft/typescript-go/shim/checker"

	nativefactories "github.com/samchon/typia/packages/typia/native/core/factories"
	nativehelpers "github.com/samchon/typia/packages/typia/native/core/programmers/helpers"
	nativehttp "github.com/samchon/typia/packages/typia/native/core/programmers/http"
	schemametadata "github.com/samchon/typia/packages/typia/native/core/schemas/metadata"
)

// nestiaSDKHttpRules bakes, for one route parameter, the violations of each
// HTTP input category's rules, keyed by the category.
//
// The SDK generators read a parameter's type from this metadata and write it
// onto the wire as a query string, headers, a path segment, or a form. Only a
// type those rules accept survives that: an object nested in a query object
// is sent as `[object Object]`, a path parameter object as its `toString()`.
// `@TypedQuery()`, `@TypedHeaders()`, and `@TypedParam()` are held to the
// rules by the core transform, which runs typia's HTTP programmers on them,
// but a vanilla `@Query()`, `@Headers()`, or `@Param()` reaches no transform,
// so the SDK checks it here. Which decorator a parameter carries is runtime
// metadata this contributor cannot see, so every category is baked and the
// SDK picks the one the decorator selects.
//
// The rules are typia's own validators where typia exports them (query,
// headers, form data), walked with typia's `MetadataFactory.Validate` over
// the type analyzed as typia's HTTP programmers analyze it, so they cannot
// drift from what the transform enforces on the typed decorators. That is its
// own analysis: the SDK's metadata shares one component collection with the
// escaped analysis of the same types, where a `Date` property is already the
// string its JSON holds, which a query string cannot send either. typia keeps
// the path parameter rule unexported, and a field-named `@Query("x")` or
// `@Headers("x")` is nestia's own case, so those two are written here.
func nestiaSDKHttpRules(checker *shimchecker.Checker, typ *shimchecker.Type) map[string]any {
	output := map[string]any{}
	analyzed := nativefactories.MetadataFactory.Analyze(nativefactories.MetadataFactory_IProps{
		Checker: checker,
		Options: nativefactories.MetadataFactory_IOptions{
			Escape:   false,
			Constant: true,
			Absorb:   true,
		},
		Components: schemametadata.NewMetadataCollection(),
		Type:       typ,
	})
	if analyzed.Success == false {
		// no rule can judge a type typia cannot analyze; every category
		// reports why
		errors := nestiaSDKHttpRuleErrors(analyzed.Errors)
		for _, category := range []string{"query", "headers", "param", "field", "formData"} {
			output[category] = errors
		}
		return output
	}
	metadata := analyzed.Data
	for _, rule := range []struct {
		category string
		functor  nativefactories.MetadataFactory_Validator
	}{
		{"query", nestiaSDKHttpQueryRule},
		{"headers", nativehttp.HttpHeadersProgrammer.Validate},
		{"param", nestiaSDKHttpParamRule},
		{"field", nestiaSDKHttpFieldRule},
		{"formData", nativehttp.HttpFormDataProgrammer.Validate},
	} {
		errors := nativefactories.MetadataFactory.Validate(struct {
			Options  nativefactories.MetadataFactory_IOptions
			Functor  nativefactories.MetadataFactory_Validator
			Metadata *schemametadata.MetadataSchema
		}{
			Options: nativefactories.MetadataFactory_IOptions{
				Escape:   false,
				Constant: true,
				Absorb:   true,
				Validate: rule.functor,
			},
			Functor:  rule.functor,
			Metadata: metadata,
		})
		output[rule.category] = nestiaSDKHttpRuleErrors(errors)
	}
	return output
}

// nestiaSDKHttpQueryRule is typia's query rule as `@TypedQuery()` applies it,
// which admits an optional query object whose properties are all optional.
func nestiaSDKHttpQueryRule(props struct {
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
		Metadata:      props.Metadata,
		Explore:       props.Explore,
		Top:           props.Top,
		AllowOptional: true,
	})
}

// nestiaSDKHttpParamRule is typia's path parameter rule
// (`httpParameterProgrammer_validate`, which typia does not export): one
// required atomic or constant type, and nothing `any`.
func nestiaSDKHttpParamRule(props struct {
	Metadata *schemametadata.MetadataSchema
	Explore  nativefactories.MetadataFactory_IExplore
	Top      *schemametadata.MetadataSchema
}) []string {
	errors := []string{}
	if props.Metadata.Any {
		errors = append(errors, "do not allow any type")
	}
	if props.Metadata.IsRequired() == false {
		errors = append(errors, "do not allow undefindable type")
	}
	atomics := nativehelpers.HttpMetadataUtil.Atomics(props.Metadata)
	if props.Metadata.Size() != nestiaSDKHttpAtomicSize(props.Metadata) || len(atomics) == 0 {
		errors = append(errors, "only atomic or constant types are allowed")
	}
	if len(atomics) > 1 {
		errors = append(errors, "do not allow union type")
	}
	return errors
}

// nestiaSDKHttpFieldRule is the rule of a field-named `@Query("key")` or
// `@Headers("key")`, which carries one query key or header rather than an
// object: an atomic, constant, or template type, or an array of those.
func nestiaSDKHttpFieldRule(props struct {
	Metadata *schemametadata.MetadataSchema
	Explore  nativefactories.MetadataFactory_IExplore
	Top      *schemametadata.MetadataSchema
}) []string {
	if props.Explore.Top {
		if props.Metadata.Size() != nestiaSDKHttpAtomicSize(props.Metadata)+len(props.Metadata.Arrays) {
			return []string{"only atomic or array of atomic types are allowed."}
		}
	} else if _, ok := props.Explore.Nested.(*schemametadata.MetadataArrayType); ok {
		if props.Metadata.Size() != nestiaSDKHttpAtomicSize(props.Metadata) {
			return []string{"only atomic types are allowed in array."}
		}
	}
	return nil
}

func nestiaSDKHttpAtomicSize(metadata *schemametadata.MetadataSchema) int {
	size := len(metadata.Atomics) + len(metadata.Templates)
	for _, constant := range metadata.Constants {
		size += len(constant.Values)
	}
	return size
}

// nestiaSDKHttpRuleErrors writes rule violations the way the SDK reports a
// failed metadata pipe: the type's name, the property it was found at, and the
// messages.
func nestiaSDKHttpRuleErrors(errors []nativefactories.MetadataFactory_IError) []any {
	output := make([]any, 0, len(errors))
	for _, err := range errors {
		output = append(output, map[string]any{
			"name":     err.Name,
			"accessor": nestiaSDKHttpRuleAccessor(err.Explore),
			"messages": err.Messages,
		})
	}
	return output
}

var nestiaSDKVariableName = regexp.MustCompile(`^[A-Za-z_$][A-Za-z0-9_$]*$`)

func nestiaSDKHttpRuleAccessor(explore nativefactories.MetadataFactory_IExplore) any {
	if explore.Object == nil {
		return nestiaSDKLiteralNull
	}
	switch key := explore.Property.(type) {
	case nil:
		return explore.Object.Name
	case string:
		if nestiaSDKVariableName.MatchString(key) {
			return explore.Object.Name + "." + key
		}
		text, _ := json.Marshal(key)
		return explore.Object.Name + "[" + string(text) + "]"
	}
	return explore.Object.Name + "[key]"
}
