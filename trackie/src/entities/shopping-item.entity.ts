import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ShoppingList } from './shopping-list.entity';
import { UnitOfMeasure } from '../enums/unit-of-measure.enum';

export enum PurchaseStatus {
    PENDING = 'pendiente',
    PURCHASED = 'comprado'
}

@Entity('shopping_items')
export class ShoppingItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({type: 'enum', enum: UnitOfMeasure, default: UnitOfMeasure.UNIT})
    unitOfMeasure: UnitOfMeasure;

    @Column({ type: 'float' })
    quantity: number;

    @Column({ type: 'float' })
    unitPrice: number;

    @Column({ type: 'float', default: 0 })
    totalPrice: number;

    @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING })
    status: PurchaseStatus;

    @ManyToOne(() => ShoppingList, (shoppingList) => shoppingList.items, { onDelete: 'CASCADE' })
    shoppingList: ShoppingList;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}