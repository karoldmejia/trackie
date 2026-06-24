import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ShoppingItem } from './shopping-item.entity';

@Entity('shopping_lists')
export class ShoppingList {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date' })
    endDate: string;

    @OneToMany(() => ShoppingItem, (item) => item.shoppingList, { cascade: true, eager: true })
    items: ShoppingItem[];

    @Column({ type: 'float', default: 0 })
    totalCost: number;

    @Column({ type: 'int', default: 0 })
    totalItems: number;

    @Column({ type: 'float', default: 0 })
    completionPercentage: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}