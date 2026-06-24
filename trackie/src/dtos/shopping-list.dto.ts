import { IsDateString, IsOptional, IsArray, ValidateNested, IsUUID, ArrayMinSize, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateShoppingItemDto } from './shopping-item.dto';
import { PurchaseStatus } from '../entities/shopping-item.entity';

export class CreateShoppingListDto {
    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateShoppingItemDto)
    items?: CreateShoppingItemDto[];
}

export class UpdateShoppingListDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class AddItemsToListDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateShoppingItemDto)
    items: CreateShoppingItemDto[];
}

export class UpdateItemStatusDto {
    @IsEnum(PurchaseStatus)
    status: PurchaseStatus;
}