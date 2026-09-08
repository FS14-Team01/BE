class AppError extends Error {
  constructor(errorDefinition) {
    super(errorDefinition.message);

    this.statusCode = errorDefinition.statusCode;
    this.code = errorDefinition.code;
  }
}

export default AppError;
