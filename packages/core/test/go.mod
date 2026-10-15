module github.com/samchon/nestia/packages/core/test

go 1.26

require (
	github.com/microsoft/typescript-go/shim/ast v0.0.0
	github.com/microsoft/typescript-go/shim/checker v0.0.0
	github.com/microsoft/typescript-go/shim/core v0.0.0
	github.com/microsoft/typescript-go/shim/parser v0.0.0
	github.com/microsoft/typescript-go/shim/printer v0.0.0
	github.com/samchon/nestia/packages/core/native v0.0.0
	github.com/samchon/ttsc/packages/ttsc v0.0.0
)

require (
	github.com/go-json-experiment/json v0.0.0-20260601182631-00ed12fed2a6 // indirect
	github.com/klauspost/cpuid/v2 v2.2.10 // indirect
	github.com/microsoft/typescript-go v0.0.0-20260610182825-7fc57c005063 // indirect
	github.com/microsoft/typescript-go/shim/bundled v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/compiler v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/diagnosticwriter v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/scanner v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/tsoptions v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/tspath v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/vfs v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/vfs/cachedvfs v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/vfs/osvfs v0.0.0 // indirect
	github.com/samchon/typia/packages/typia/native v0.0.0-20260926142025-755176823ba3 // indirect
	github.com/zeebo/xxh3 v1.1.0 // indirect
	golang.org/x/sync v0.21.0 // indirect
	golang.org/x/sys v0.46.0 // indirect
	golang.org/x/text v0.38.0 // indirect
)

replace (
	github.com/microsoft/typescript-go/shim/ast => github.com/samchon/ttsc/packages/ttsc/shim/ast v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/bundled => github.com/samchon/ttsc/packages/ttsc/shim/bundled v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/checker => github.com/samchon/ttsc/packages/ttsc/shim/checker v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/compiler => github.com/samchon/ttsc/packages/ttsc/shim/compiler v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/core => github.com/samchon/ttsc/packages/ttsc/shim/core v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/diagnosticwriter => github.com/samchon/ttsc/packages/ttsc/shim/diagnosticwriter v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/parser => github.com/samchon/ttsc/packages/ttsc/shim/parser v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/printer => github.com/samchon/ttsc/packages/ttsc/shim/printer v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/scanner => github.com/samchon/ttsc/packages/ttsc/shim/scanner v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/tsoptions => github.com/samchon/ttsc/packages/ttsc/shim/tsoptions v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/tspath => github.com/samchon/ttsc/packages/ttsc/shim/tspath v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/vfs => github.com/samchon/ttsc/packages/ttsc/shim/vfs v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/vfs/cachedvfs => github.com/samchon/ttsc/packages/ttsc/shim/vfs/cachedvfs v0.0.0-20261015045259-d63eaf503908
	github.com/microsoft/typescript-go/shim/vfs/osvfs => github.com/samchon/ttsc/packages/ttsc/shim/vfs/osvfs v0.0.0-20261015045259-d63eaf503908
	github.com/samchon/nestia/packages/core/native => ../native
	github.com/samchon/ttsc/packages/ttsc => github.com/samchon/ttsc/packages/ttsc v0.0.0-20261015045259-d63eaf503908
)
