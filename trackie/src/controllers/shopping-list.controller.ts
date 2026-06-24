import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, Query, Patch} from '@nestjs/common';
import { UpdateShoppingItemDto } from '../dtos/shopping-item.dto';
import { AddItemsToListDto, CreateShoppingListDto, UpdateItemStatusDto, UpdateShoppingListDto } from '../dtos/shopping-list.dto';
import { ShoppingItem } from '../entities/shopping-item.entity';
import { ShoppingList } from '../entities/shopping-list.entity';
import { ShoppingListService } from '../services/shopping-list.service';

@Controller('shopping-lists')
export class ShoppingListController {
    constructor(private readonly shoppingListService: ShoppingListService) {}

    @Post()
    async create(@Body() createDto: CreateShoppingListDto): Promise<ShoppingList> {
        return this.shoppingListService.create(createDto);
    }

    @Get()
    async findAll(): Promise<ShoppingList[]> {
        return this.shoppingListService.findAll();
    }

    @Get('history')
    async getHistory(): Promise<ShoppingList[]> {
        return this.shoppingListService.getHistory();
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ShoppingList> {
        return this.shoppingListService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateShoppingListDto
    ): Promise<ShoppingList> {
        return this.shoppingListService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.shoppingListService.remove(id);
    }

    @Post(':listId/items')
    async addItems(@Param('listId', ParseUUIDPipe) listId: string, @Body() addItemsDto: AddItemsToListDto): Promise<ShoppingList> {
        return this.shoppingListService.addItems(listId, addItemsDto.items);
    }

    @Put('items/:itemId')
    async updateItem(@Param('itemId', ParseUUIDPipe) itemId: string, @Body() updateDto: UpdateShoppingItemDto): Promise<ShoppingItem> {
        return this.shoppingListService.updateItem(itemId, updateDto);
    }

    @Delete('items/:itemId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeItem(@Param('itemId', ParseUUIDPipe) itemId: string): Promise<void> {
        await this.shoppingListService.removeItem(itemId);
    }

    @Patch('items/:itemId/status')
    async updateItemStatus(@Param('itemId', ParseUUIDPipe) itemId: string, @Body() updateStatusDto: UpdateItemStatusDto): Promise<ShoppingItem> {
        return this.shoppingListService.updateItemStatus(itemId, updateStatusDto.status);
    }

    @Patch('items/:itemId/toggle-status')
    async toggleItemStatus(@Param('itemId', ParseUUIDPipe) itemId: string): Promise<ShoppingItem> {
        return this.shoppingListService.toggleItemStatus(itemId);
    }
}