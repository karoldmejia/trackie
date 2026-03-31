import { IsDateString, IsNumber, Min, IsOptional, IsArray, IsString, Max } from 'class-validator';

export class CreateWeightLogDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyfat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  skeletalMuscle?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waist?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateWeightLogDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyfat?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  skeletalMuscle?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  waist?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  photosToDelete?: string[];
}