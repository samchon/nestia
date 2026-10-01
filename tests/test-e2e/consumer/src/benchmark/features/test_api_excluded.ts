// The caller filter must reject this module before importing it. The original
// excluded POST's body never ran, so an import failure is a stronger control.
throw new Error("The excluded benchmark feature was imported.");
export {};
