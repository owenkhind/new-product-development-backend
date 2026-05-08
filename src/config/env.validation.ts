import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().default('new-product-development-backend'),
  APP_VERSION: Joi.string().default('0.1.0'),
  FRONTEND_ORIGIN: Joi.string().allow('').optional(),
  AUTH_SESSION_SECRET: Joi.string().min(32).optional(),
  TEMP_AUTH_PASSWORD: Joi.string().min(8).optional(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .optional(),
  DB_HOST: Joi.string().hostname().optional(),
  DB_PORT: Joi.number().port().optional(),
  DB_DATABASE: Joi.string().optional(),
  DB_USERNAME: Joi.string().optional(),
  DB_PASSWORD: Joi.string().allow('').optional(),
  DB_SSLMODE: Joi.string()
    .valid('disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full')
    .default('disable'),
  DB_SCHEMA: Joi.string().default('public'),
  DB_PROMOTER_SCHEMA: Joi.string().optional(),
}).custom((value, helpers) => {
  const hasDatabaseUrl =
    typeof value.DATABASE_URL === 'string' && value.DATABASE_URL.length > 0;
  const hasDiscreteConfig =
    typeof value.DB_HOST === 'string' &&
    typeof value.DB_DATABASE === 'string' &&
    typeof value.DB_USERNAME === 'string' &&
    typeof value.DB_PASSWORD === 'string';

  if (!hasDatabaseUrl && !hasDiscreteConfig) {
    return helpers.error('any.custom', {
      message:
        'Provide DATABASE_URL or the DB_HOST, DB_DATABASE, DB_USERNAME, and DB_PASSWORD variables.',
    });
  }

  if (value.NODE_ENV === 'production' && !value.AUTH_SESSION_SECRET) {
    return helpers.error('any.custom', {
      message:
        'Provide AUTH_SESSION_SECRET for production authentication sessions.',
    });
  }

  if (value.NODE_ENV === 'production' && !value.TEMP_AUTH_PASSWORD) {
    return helpers.error('any.custom', {
      message:
        'Provide TEMP_AUTH_PASSWORD while temporary email/password authentication is enabled.',
    });
  }

  return value;
}, 'database connection validation');
