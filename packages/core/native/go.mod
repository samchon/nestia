module github.com/samchon/nestia/packages/core/native

go 1.26

require (
	github.com/microsoft/typescript-go/shim/ast v0.0.0
	github.com/microsoft/typescript-go/shim/checker v0.0.0
	github.com/microsoft/typescript-go/shim/compiler v0.0.0
	github.com/microsoft/typescript-go/shim/core v0.0.0
	github.com/microsoft/typescript-go/shim/printer v0.0.0
	github.com/microsoft/typescript-go/shim/scanner v0.0.0
	github.com/samchon/ttsc/packages/ttsc v0.0.0
	github.com/samchon/typia/packages/typia/native v0.0.0-20260709031533-27f105ae8e56
)

require (
	github.com/go-json-experiment/json v0.0.0-20260214004413-d219187c3433 // indirect
	github.com/klauspost/cpuid/v2 v2.2.10 // indirect
	github.com/microsoft/typescript-go v0.0.0-20260429010842-56ab4af42157 // indirect
	github.com/microsoft/typescript-go/shim/bundled v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/diagnosticwriter v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/parser v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/tsoptions v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/tspath v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/vfs v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/vfs/cachedvfs v0.0.0 // indirect
	github.com/microsoft/typescript-go/shim/vfs/osvfs v0.0.0 // indirect
	github.com/zeebo/xxh3 v1.1.0 // indirect
	golang.org/x/sync v0.20.0 // indirect
	golang.org/x/sys v0.43.0 // indirect
	golang.org/x/text v0.36.0 // indirect
)

replace github.com/microsoft/typescript-go/shim/ast => github.com/samchon/ttsc/packages/ttsc/shim/ast v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/bundled => github.com/samchon/ttsc/packages/ttsc/shim/bundled v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/checker => github.com/samchon/ttsc/packages/ttsc/shim/checker v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/compiler => github.com/samchon/ttsc/packages/ttsc/shim/compiler v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/core => github.com/samchon/ttsc/packages/ttsc/shim/core v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/diagnosticwriter => github.com/samchon/ttsc/packages/ttsc/shim/diagnosticwriter v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/parser => github.com/samchon/ttsc/packages/ttsc/shim/parser v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/printer => github.com/samchon/ttsc/packages/ttsc/shim/printer v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/scanner => github.com/samchon/ttsc/packages/ttsc/shim/scanner v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/tsoptions => github.com/samchon/ttsc/packages/ttsc/shim/tsoptions v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/tspath => github.com/samchon/ttsc/packages/ttsc/shim/tspath v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/vfs => github.com/samchon/ttsc/packages/ttsc/shim/vfs v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/vfs/cachedvfs => github.com/samchon/ttsc/packages/ttsc/shim/vfs/cachedvfs v0.0.0-20260709053824-84bdc4acccb0

replace github.com/microsoft/typescript-go/shim/vfs/osvfs => github.com/samchon/ttsc/packages/ttsc/shim/vfs/osvfs v0.0.0-20260709053824-84bdc4acccb0

replace github.com/samchon/ttsc/packages/ttsc => github.com/samchon/ttsc/packages/ttsc v0.0.0-20260709053824-84bdc4acccb0
