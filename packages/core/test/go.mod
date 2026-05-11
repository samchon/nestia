module github.com/samchon/nestia/packages/core/test

go 1.26

replace github.com/samchon/nestia/packages/core/native => ../native

replace github.com/microsoft/typescript-go/shim/printer => github.com/samchon/typia/packages/typia/native/shim/printer v0.0.0-20260510131441-ab7b72500dd0

require (
	github.com/samchon/nestia/packages/core/native v0.0.0
	github.com/samchon/typia/packages/typia/native v0.0.0-20260510131441-ab7b72500dd0
)
