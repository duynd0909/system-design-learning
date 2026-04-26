import { IsString, IsObject, IsInt, IsPositive, Min } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  problemId!: string;

  @IsInt()
  @Min(1)
  requirementOrder!: number;

  @IsObject()
  slotAnswers!: Record<string, string>;

  @IsInt()
  @IsPositive()
  timeTakenMs!: number;
}
