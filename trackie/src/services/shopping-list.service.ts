import { Injectable, BadRequestException, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateShoppingItemDto, UpdateShoppingItemDto } from '../dtos/shopping-item.dto';
import { CreateShoppingListDto, UpdateShoppingListDto } from '../dtos/shopping-list.dto';
import { PurchaseStatus, ShoppingItem } from '../entities/shopping-item.entity';
import { ShoppingList } from '../entities/shopping-list.entity';
import { Repository, Between } from 'typeorm';

@Injectable()
export class ShoppingListService {
    constructor(
        @InjectRepository(ShoppingList)
        private readonly shoppingListRepository: Repository<ShoppingList>,
        
        @InjectRepository(ShoppingItem)
        private readonly shoppingItemRepository: Repository<ShoppingItem>,
    ) {}


    private async validateNoOverlap(
        startDate: string, 
        endDate: string, 
        excludeId?: string
    ): Promise<void> {
        const query = this.shoppingListRepository.createQueryBuilder('list')
            .where(
                '(:startDate <= list.endDate AND :endDate >= list.startDate)',
                { startDate, endDate }
            );

        if (excludeId) {
            query.andWhere('list.id != :excludeId', { excludeId });
        }

        const overlapping = await query.getMany();
        
        if (overlapping.length > 0) {
            throw new BadRequestException(
                'Ya existe una lista de compras que cubre este período de tiempo'
            );
        }
    }

    private calculateItemTotals(items: ShoppingItem[]): void {
        items.forEach(item => {
            item.totalPrice = item.quantity * item.unitPrice;
        });
    }

    private calculateListTotals(list: ShoppingList): void {
        // Calcular total de cada item
        this.calculateItemTotals(list.items);

        // Calcular total de la lista
        let totalCost = 0;
        let purchasedItems = 0;

        list.items.forEach(item => {
            totalCost += item.totalPrice;
            if (item.status === PurchaseStatus.PURCHASED) {
                purchasedItems++;
            }
        });

        list.totalCost = totalCost;
        list.totalItems = list.items.length;
        list.completionPercentage = list.items.length > 0 
            ? (purchasedItems / list.items.length) * 100 
            : 0;
    }

    async create(createDto: CreateShoppingListDto): Promise<ShoppingList> {
        // Validar fechas
        if (new Date(createDto.startDate) > new Date(createDto.endDate)) {
            throw new BadRequestException('La fecha de inicio no puede ser mayor a la fecha de fin');
        }

        // Validar overlapping
        await this.validateNoOverlap(createDto.startDate, createDto.endDate);

        // Crear la lista
        const list = this.shoppingListRepository.create({
            startDate: createDto.startDate,
            endDate: createDto.endDate,
            items: []
        });

        // Agregar items si existen
        if (createDto.items && createDto.items.length > 0) {
            const items = createDto.items.map(itemDto => 
                this.shoppingItemRepository.create({
                    ...itemDto,
                    shoppingList: list
                })
            );
            list.items = items;
        }

        // Calcular totales
        this.calculateListTotals(list);

        return this.shoppingListRepository.save(list);
    }

    async findAll(): Promise<ShoppingList[]> {
        return this.shoppingListRepository.find({
            order: { startDate: 'DESC' }
        });
    }

    async getHistory(): Promise<ShoppingList[]> {
        return this.shoppingListRepository.find({
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<ShoppingList> {
        const list = await this.shoppingListRepository.findOne({
            where: { id },
            relations: { items: true }
        });

        if (!list) {
            throw new NotFoundException(`Lista de compras con ID ${id} no encontrada`);
        }

        return list;
    }

    async update(id: string, updateDto: UpdateShoppingListDto): Promise<ShoppingList> {
        const list = await this.findOne(id);

        // Validar fechas si se están actualizando
        const startDate = updateDto.startDate || list.startDate;
        const endDate = updateDto.endDate || list.endDate;

        if (new Date(startDate) > new Date(endDate)) {
            throw new BadRequestException('La fecha de inicio no puede ser mayor a la fecha de fin');
        }

        // Validar overlapping si cambian las fechas
        if (updateDto.startDate || updateDto.endDate) {
            await this.validateNoOverlap(startDate, endDate, id);
        }

        // Actualizar campos
        if (updateDto.startDate) list.startDate = updateDto.startDate;
        if (updateDto.endDate) list.endDate = updateDto.endDate;

        // Recalcular totales
        this.calculateListTotals(list);

        return this.shoppingListRepository.save(list);
    }

    async remove(id: string): Promise<void> {
        const list = await this.findOne(id);
        await this.shoppingListRepository.remove(list);
    }

    async addItems(listId: string, itemsDto: CreateShoppingItemDto[]): Promise<ShoppingList> {
        const list = await this.findOne(listId);

        const newItems = itemsDto.map(itemDto => 
            this.shoppingItemRepository.create({
                ...itemDto,
                shoppingList: list
            })
        );

        list.items.push(...newItems);
        this.calculateListTotals(list);

        return this.shoppingListRepository.save(list);
    }

    async updateItem(itemId: string, updateDto: UpdateShoppingItemDto): Promise<ShoppingItem> {
        const item = await this.shoppingItemRepository.findOne({
            where: { id: itemId },
            relations: { shoppingList: true }
        });

        if (!item) {
            throw new NotFoundException(`Item con ID ${itemId} no encontrado`);
        }

        // Actualizar campos
        if (updateDto.name !== undefined) item.name = updateDto.name;
        if (updateDto.unitOfMeasure !== undefined) item.unitOfMeasure = updateDto.unitOfMeasure;
        if (updateDto.quantity !== undefined) item.quantity = updateDto.quantity;
        if (updateDto.unitPrice !== undefined) item.unitPrice = updateDto.unitPrice;
        if (updateDto.status !== undefined) item.status = updateDto.status;

        // Recalcular total del item
        item.totalPrice = item.quantity * item.unitPrice;

        // Guardar el item
        const savedItem = await this.shoppingItemRepository.save(item);

        // Recalcular totales de la lista
        const list = await this.findOne(item.shoppingList.id);
        this.calculateListTotals(list);
        await this.shoppingListRepository.save(list);

        return savedItem;
    }

    async removeItem(itemId: string): Promise<void> {
        const item = await this.shoppingItemRepository.findOne({
            where: { id: itemId },
            relations: { shoppingList: true }
        });

        if (!item) {
            throw new NotFoundException(`Item con ID ${itemId} no encontrado`);
        }

        const listId = item.shoppingList.id;
        
        // Eliminar el item
        await this.shoppingItemRepository.remove(item);

        // Recalcular totales de la lista
        const list = await this.findOne(listId);
        this.calculateListTotals(list);
        await this.shoppingListRepository.save(list);
    }

    async updateItemStatus(itemId: string, status: PurchaseStatus): Promise<ShoppingItem> {
        return this.updateItem(itemId, { status });
    }

    async toggleItemStatus(itemId: string): Promise<ShoppingItem> {
        const item = await this.shoppingItemRepository.findOne({
            where: { id: itemId },
            relations: { shoppingList: true }
        });

        if (!item) {
            throw new NotFoundException(`Item con ID ${itemId} no encontrado`);
        }

        // Toggle status
        const newStatus = item.status === PurchaseStatus.PENDING 
            ? PurchaseStatus.PURCHASED 
            : PurchaseStatus.PENDING;

        return this.updateItemStatus(itemId, newStatus);
    }
}