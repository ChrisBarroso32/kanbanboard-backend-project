import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { load } from 'js-yaml';

export const SWAGGER_PATH = 'api/docs';

// The spec is hand-written in YAML (source of truth) instead of generated from
// decorators; nest-cli copies it next to this file on build.
export function setupSwagger(app: INestApplication): void {
  const document = load(
    readFileSync(join(__dirname, 'openapi.yaml'), 'utf8'),
  ) as OpenAPIObject;

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
