import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';
import { ProgramKind } from '../enums/program-kind.enum';
import { TargetDirection } from '../enums/target-direction.enum';

/**
 * Target dinámico de un Program. El metric type se referencia por su `key`
 * (slug inmutable del catálogo metric_types).
 */
export class ProgramMetricTargetDto {
    @IsString()
    key: string;

    @IsNumber()
    @Min(0)
    target: number;

    @IsEnum(TargetDirection)
    direction: TargetDirection;

    @IsNumber()
    @Min(0)
    weight: number;

    @IsOptional()
    @IsBoolean()
    isOptional?: boolean;
}

export class CreateProgramDto {
    @IsString()
    @MaxLength(120)
    name: string;

    @IsEnum(ProgramKind)
    kind: ProgramKind;

    @IsDateString()
    startDate: string; // YYYY-MM-DD

    @IsDateString()
    endDate: string; // YYYY-MM-DD

    @IsOptional()
    @IsInt()
    @Min(0)
    workoutsPerWeek?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ProgramMetricTargetDto)
    targets: ProgramMetricTargetDto[];
}

export class UpdateProgramDto extends PartialType(CreateProgramDto) {}
