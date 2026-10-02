/**
 * A tracing decorator such as `nestjs-otel`'s `@Span()`, which instruments
 * methods outside any controller.
 */
const Span = (): MethodDecorator => () => {};

const key = "dynamic";

/**
 * A non-controller class whose decorated methods declare names that are no
 * identifiers: destructured parameters and computed method names.
 */
export class TracedRepository {
  @Span()
  public async findPending({
    organizationId,
  }: {
    organizationId: string;
  }): Promise<string> {
    return organizationId;
  }

  @Span()
  public first([head]: string[]): string {
    return head ?? "";
  }

  @Span()
  public ["literal-name"](): string {
    return "literal";
  }

  @Span()
  public [key](): string {
    return key;
  }
}
