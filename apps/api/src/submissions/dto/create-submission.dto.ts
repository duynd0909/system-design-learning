import { IsString, IsObject, IsInt, IsPositive } from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  problemId!: string;

  @IsObject()
  slotAnswers!: Record<string, string>;

  @IsInt()
  @IsPositive()
  timeTakenMs!: number;
}
