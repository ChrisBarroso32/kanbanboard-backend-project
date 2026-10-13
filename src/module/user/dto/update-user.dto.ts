import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Only editable profile fields belong here. Anything else (id, email,
// emailVerified, timestamps, auth data) is rejected by the global
// ValidationPipe (whitelist + forbidNonWhitelisted).
export class UpdateUserDto {
  // name is non-nullable in the schema, so null is rejected rather than skipped
  @ValidateIf((dto: UpdateUserDto) => dto.name !== undefined)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  // null clears the image
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  image?: string | null;
}
