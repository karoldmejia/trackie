// services/shoppingListService.ts
import api from './api';

export enum UnitOfMeasure {
    KILOGRAM = 'kg',
    GRAM = 'g',
    MILLIGRAM = 'mg',
    POUND = 'lb',
    LITER = 'L',
    MILLILITER = 'mL',
    UNIT = 'unidad',
    DOZEN = 'docena',
}

export enum PurchaseStatus {
    PENDING = 'pendiente',
    PURCHASED = 'comprado'
}

export interface ShoppingItem {
    id: string;
    name: string;
    unitOfMeasure: UnitOfMeasure;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: PurchaseStatus;
    shoppingList: ShoppingList;
    createdAt?: string;
    updatedAt?: string;
}

export interface ShoppingList {
    id: string;
    startDate: string;
    endDate: string;
    items: ShoppingItem[];
    totalCost: number;
    totalItems: number;
    completionPercentage: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateShoppingItemDto {
    name: string;
    unitOfMeasure: UnitOfMeasure;
    quantity: number;
    unitPrice: number;
    status?: PurchaseStatus;
}

export interface CreateShoppingListDto {
    startDate: string;
    endDate: string;
    items?: CreateShoppingItemDto[];
}

export interface UpdateShoppingListDto {
    startDate?: string;
    endDate?: string;
}

export interface UpdateShoppingItemDto {
    name?: string;
    unitOfMeasure?: UnitOfMeasure;
    quantity?: number;
    unitPrice?: number;
    status?: PurchaseStatus;
}

export const shoppingListService = {
    // Shopping List methods
    create: async (data: CreateShoppingListDto): Promise<ShoppingList> => {
        const response = await api.post<ShoppingList>('/shopping-lists', data);
        return response.data;
    },

    findAll: async (): Promise<ShoppingList[]> => {
        const response = await api.get<ShoppingList[]>('/shopping-lists');
        return response.data;
    },

    getHistory: async (): Promise<ShoppingList[]> => {
        const response = await api.get<ShoppingList[]>('/shopping-lists/history');
        return response.data;
    },

    findOne: async (id: string): Promise<ShoppingList> => {
        const response = await api.get<ShoppingList>(`/shopping-lists/${id}`);
        return response.data;
    },

    update: async (id: string, data: UpdateShoppingListDto): Promise<ShoppingList> => {
        const response = await api.put<ShoppingList>(`/shopping-lists/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/shopping-lists/${id}`);
    },

    // Shopping Item methods
    addItems: async (listId: string, items: CreateShoppingItemDto[]): Promise<ShoppingList> => {
        const response = await api.post<ShoppingList>(`/shopping-lists/${listId}/items`, { items });
        return response.data;
    },

    updateItem: async (itemId: string, data: UpdateShoppingItemDto): Promise<ShoppingItem> => {
        const response = await api.put<ShoppingItem>(`/shopping-lists/items/${itemId}`, data);
        return response.data;
    },

    deleteItem: async (itemId: string): Promise<void> => {
        await api.delete(`/shopping-lists/items/${itemId}`);
    },

    toggleItemStatus: async (itemId: string): Promise<ShoppingItem> => {
        const response = await api.patch<ShoppingItem>(`/shopping-lists/items/${itemId}/toggle-status`);
        return response.data;
    },

    updateItemStatus: async (itemId: string, status: PurchaseStatus): Promise<ShoppingItem> => {
        const response = await api.patch<ShoppingItem>(`/shopping-lists/items/${itemId}/status`, { status });
        return response.data;
    },
};