export namespace Configuration {
    export const PORT = 12345;
    export const ENCRYPTION_PASSWORD = {
        key: "a".repeat(32),
        iv: "b".repeat(16),
    };
}
