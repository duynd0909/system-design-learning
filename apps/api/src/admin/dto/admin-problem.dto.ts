import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Difficulty } from '@prisma/client';
import type { GraphEdge, GraphNode } from '@stackdify/shared-types';

export class AdminProblemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must use lowercase letters, numbers, and hyphens',
  })
  slug!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category!: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateAdminProblemDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class AdminRequirementDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @IsArray()
  nodes!: GraphNode[];

  @IsArray()
  edges!: GraphEdge[];

  @IsObject()
  answer!: Record<string, string>;
}

export class ReplaceRequirementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminRequirementDto)
  requirements!: AdminRequirementDto[];
}
