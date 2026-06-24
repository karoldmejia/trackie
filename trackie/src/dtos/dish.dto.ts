import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDishDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateDishDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

