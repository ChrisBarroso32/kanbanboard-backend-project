import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65535)
  PORT: number = 3000;
}

// Fails fast at bootstrap; ValidationError#toString lists property names and
// constraints only, so secret values are never printed.
export function validateEnv(config: Record<string, unknown>) {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(env);
  if (errors.length > 0) {
    throw new Error(
      `Invalid environment variables:\n${errors.map(String).join('')}`,
    );
  }
  return env;
}
