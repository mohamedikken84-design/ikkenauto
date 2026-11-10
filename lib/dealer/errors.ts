export class AccountInputError extends Error {}

export class AccountFieldError extends AccountInputError {
  fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super(Object.values(fields)[0] ?? "Controleer de gemarkeerde velden.");
    this.fields = fields;
  }
}
