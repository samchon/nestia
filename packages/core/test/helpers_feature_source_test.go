package test

import (
	"os"
	"path/filepath"
	"testing"
)

// featureSource joins a feature's src-relative path into an absolute path.
func featureSource(t *testing.T, feature, rel string) string {
	t.Helper()
	return filepath.Join(featureRootForCore(t, feature), "src", rel)
}

// mustReadFile reads a file, failing the test if it is missing.
func mustReadFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("expected file %s: %v", path, err)
	}
	return string(data)
}
