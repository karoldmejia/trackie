import { IsString, IsNumber, Min, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { UnitOfMeasure } from '../enums/unit-of-measure.enum';
import { PurchaseStatus } from '../entities/shopping-item.entity';

export class CreateShoppingItemDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsEnum(UnitOfMeasure)
    unitOfMeasure: UnitOfMeasure;

    @IsNumber()
    @Min(0.01)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsOptional()
    @IsEnum(PurchaseStatus)
    status?: PurchaseStatus;
}

export class UpdateShoppingItemDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsEnum(UnitOfMeasure)
    unitOfMeasure?: UnitOfMeasure;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    quantity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;

    @IsOptional()
    @IsEnum(PurchaseStatus)
    status?: PurchaseStatus;
}