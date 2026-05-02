import { IsEnum } from 'class-validator';
import { Role } from '@stackdify/shared-types';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;
}
