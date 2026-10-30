import { BadRequestException } from '@nestjs/common';
import { getMetadataStorage, ValidationError } from 'class-validator';

/**
 * Stable codes of the validation errors, for the app to translate. The
 * French `message` next to each one is a fallback for screens that do not
 * map the code yet. Documented in README.md.
 */
export const VALIDATION_CODES = {
  FIELD_REQUIRED: 'FIELD_REQUIRED',
  FIELD_NOT_ALLOWED: 'FIELD_NOT_ALLOWED',
  FIELD_TOO_SHORT: 'FIELD_TOO_SHORT',
  FIELD_TOO_LONG: 'FIELD_TOO_LONG',
  EMAIL_INVALID: 'EMAIL_INVALID',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG: 'PASSWORD_TOO_LONG',
  USERNAME_INVALID: 'USERNAME_INVALID',
  STRING_EXPECTED: 'STRING_EXPECTED',
  NUMBER_INVALID: 'NUMBER_INVALID',
  INTEGER_EXPECTED: 'INTEGER_EXPECTED',
  BOOLEAN_EXPECTED: 'BOOLEAN_EXPECTED',
  VALUE_TOO_SMALL: 'VALUE_TOO_SMALL',
  VALUE_TOO_LARGE: 'VALUE_TOO_LARGE',
  VALUE_NOT_ALLOWED: 'VALUE_NOT_ALLOWED',
  DATE_INVALID: 'DATE_INVALID',
  ID_INVALID: 'ID_INVALID',
  FORMAT_INVALID: 'FORMAT_INVALID',
  ARRAY_EXPECTED: 'ARRAY_EXPECTED',
  ARRAY_TOO_SHORT: 'ARRAY_TOO_SHORT',
  ARRAY_TOO_LONG: 'ARRAY_TOO_LONG',
  INVALID: 'INVALID',
} as const;

export type ValidationCode = keyof typeof VALIDATION_CODES;

export interface FieldError {
  /** Path of the field in the body or query: `exercises.0.sets.1.weight`. */
  field: string;
  code: ValidationCode;
  message: string;
}

/** Body of a 400 caused by validation, sent as is by AllExceptionsFilter. */
export interface ValidationErrorBody {
  statusCode: 400;
  code: 'VALIDATION_ERROR';
  /** The first error's message, for clients that read a single string. */
  message: string;
  errors: FieldError[];
}

const PASSWORD_FIELDS = /(^|\.)(password|currentPassword|newPassword)$/;
const USERNAME_FIELDS = /(^|\.)uniqueName$/;

const CODE_BY_CONSTRAINT: Record<string, ValidationCode> = {
  isDefined: 'FIELD_REQUIRED',
  isNotEmpty: 'FIELD_REQUIRED',
  whitelistValidation: 'FIELD_NOT_ALLOWED',
  minLength: 'FIELD_TOO_SHORT',
  maxLength: 'FIELD_TOO_LONG',
  isLength: 'FIELD_TOO_LONG',
  isEmail: 'EMAIL_INVALID',
  isString: 'STRING_EXPECTED',
  isNumber: 'NUMBER_INVALID',
  isInt: 'INTEGER_EXPECTED',
  isBoolean: 'BOOLEAN_EXPECTED',
  min: 'VALUE_TOO_SMALL',
  max: 'VALUE_TOO_LARGE',
  isEnum: 'VALUE_NOT_ALLOWED',
  isIn: 'VALUE_NOT_ALLOWED',
  isDate: 'DATE_INVALID',
  isDateString: 'DATE_INVALID',
  isIso8601: 'DATE_INVALID',
  isUuid: 'ID_INVALID',
  matches: 'FORMAT_INVALID',
  isArray: 'ARRAY_EXPECTED',
  arrayMinSize: 'ARRAY_TOO_SHORT',
  arrayNotEmpty: 'ARRAY_TOO_SHORT',
  arrayMaxSize: 'ARRAY_TOO_LONG',
};

function codeFor(
  field: string,
  constraint: string,
  args: unknown[],
): ValidationCode {
  if (PASSWORD_FIELDS.test(field)) {
    if (constraint === 'minLength') return 'PASSWORD_TOO_SHORT';
    if (constraint === 'maxLength') return 'PASSWORD_TOO_LONG';
  }
  if (
    USERNAME_FIELDS.test(field) &&
    ['minLength', 'maxLength', 'matches', 'isLength'].includes(constraint)
  )
    return 'USERNAME_INVALID';
  // @Length(min, max): too short when under min, else too long.
  if (constraint === 'isLength' && typeof args[0] === 'number')
    return 'FIELD_TOO_LONG';
  return CODE_BY_CONSTRAINT[constraint] ?? 'INVALID';
}

function frenchMessage(field: string, code: ValidationCode, args: unknown[]) {
  // Decorator arguments are numbers for every rule that quotes them.
  const n = typeof args[0] === 'number' ? args[0] : undefined;
  const name = `« ${field} »`;

  switch (code) {
    case 'FIELD_REQUIRED':
      return `Le champ ${name} est obligatoire.`;
    case 'FIELD_NOT_ALLOWED':
      return `Le champ ${name} n'est pas accepté.`;
    case 'FIELD_TOO_SHORT':
      return `${name} doit contenir au moins ${String(n)} caractères.`;
    case 'FIELD_TOO_LONG':
      return `${name} ne doit pas dépasser ${String(typeof args[1] === 'number' ? args[1] : n)} caractères.`;
    case 'EMAIL_INVALID':
      return 'Adresse e-mail invalide.';
    case 'PASSWORD_TOO_SHORT':
      return `Le mot de passe doit contenir au moins ${String(n)} caractères.`;
    case 'PASSWORD_TOO_LONG':
      return `Le mot de passe ne doit pas dépasser ${String(n)} caractères.`;
    case 'USERNAME_INVALID':
      return 'Le pseudo doit faire 3 à 30 caractères : lettres sans accent, chiffres, « _ » et « . ».';
    case 'STRING_EXPECTED':
      return `${name} doit être un texte.`;
    case 'NUMBER_INVALID':
      return `${name} doit être un nombre (2 décimales au plus).`;
    case 'INTEGER_EXPECTED':
      return `${name} doit être un nombre entier.`;
    case 'BOOLEAN_EXPECTED':
      return `${name} doit valoir true ou false.`;
    case 'VALUE_TOO_SMALL':
      return `${name} doit être supérieur ou égal à ${String(n)}.`;
    case 'VALUE_TOO_LARGE':
      return `${name} doit être inférieur ou égal à ${String(n)}.`;
    case 'VALUE_NOT_ALLOWED':
      return `Valeur non autorisée pour ${name}.`;
    case 'DATE_INVALID':
      return `${name} doit être une date valide.`;
    case 'ID_INVALID':
      return 'Identifiant invalide';
    case 'FORMAT_INVALID':
      return `Format invalide pour ${name}.`;
    case 'ARRAY_EXPECTED':
      return `${name} doit être une liste.`;
    case 'ARRAY_TOO_SHORT':
      return `${name} doit contenir au moins ${String(n ?? 1)} élément(s).`;
    case 'ARRAY_TOO_LONG':
      return `${name} ne doit pas contenir plus de ${String(n)} éléments.`;
    default:
      return `Valeur invalide pour ${name}.`;
  }
}

/**
 * The decorator behind a failed constraint: its arguments (the 500 of
 * @MaxLength(500)) and the message it was given, if any. A message written
 * in the DTO is kept, since it is already meant for users.
 */
function decoratorOf(error: ValidationError, constraint: string) {
  const target = error.target?.constructor;

  if (!target) return undefined;
  return getMetadataStorage()
    .getTargetValidationMetadatas(target, '', true, false)
    .find((m) => m.propertyName === error.property && m.name === constraint);
}

/** Flattens class-validator errors, nested objects and arrays included. */
export function toFieldErrors(
  errors: ValidationError[],
  parent = '',
): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.keys(error.constraints ?? {}).map((constraint) => {
      const decorator = decoratorOf(error, constraint);
      const args = (decorator?.constraints ?? []) as unknown[];
      const code = codeFor(field, constraint, args);
      const custom =
        typeof decorator?.message === 'string' ? decorator.message : undefined;

      return {
        field,
        code,
        message: custom ?? frenchMessage(field, code, args),
      };
    });

    return [...own, ...toFieldErrors(error.children ?? [], field)];
  });
}

/** The 400 of a failed validation, in the structured format. */
export class ValidationFailedException extends BadRequestException {
  constructor(errors: FieldError[]) {
    const body: ValidationErrorBody = {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: errors[0]?.message ?? 'Requête invalide.',
      errors,
    };

    super(body);
  }
}

/** exceptionFactory of the global ValidationPipe. */
export const validationExceptionFactory = (errors: ValidationError[]) =>
  new ValidationFailedException(toFieldErrors(errors));
