import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DayPlan } from '../entities/day-plan.entity';
import { In, Repository } from 'typeorm';
import { PlannedMeal } from '../entities/planned-meal.entity';
import { Dish } from '../entities/dish.entity';
import { CreateDayPlanDto } from '../dtos/day-plan.dto';
import { CreatePlannedMealDto, CreatePlannedMealRangeDto, UpdatePlannedMealDto } from '../dtos/planned-meal.dto';
import { CreateDishDto, UpdateDishDto } from '../dtos/dish.dto';
import { MealType } from 'src/enums/meal-type.enum';

@Injectable()
export class MealPlannerService {
    constructor(
        @InjectRepository(DayPlan)
        private readonly dayPlanRepository: Repository<DayPlan>,

        @InjectRepository(PlannedMeal)
        private readonly plannedMealRepository: Repository<PlannedMeal>,

        @InjectRepository(Dish)
        private readonly dishRepository: Repository<Dish>,
    ) { }

    async createDayPlan(createDayPlanDto: CreateDayPlanDto): Promise<DayPlan> {
        // Validar que no exista un DayPlan para esa fecha
        const existingDayPlan = await this.dayPlanRepository.findOne({
            where: { date: createDayPlanDto.date }
        });

        if (existingDayPlan) {
            throw new BadRequestException(
                `Ya existe un plan para la fecha ${createDayPlanDto.date}`
            );
        }

        // Crear el DayPlan
        const dayPlan = this.dayPlanRepository.create({
            date: createDayPlanDto.date
        });

        // Si se proporcionan PlannedMeals, crearlos
        if (createDayPlanDto.plannedMeals && createDayPlanDto.plannedMeals.length > 0) {
            const plannedMeals = await Promise.all(
                createDayPlanDto.plannedMeals.map(async (mealDto) => {
                    const plannedMeal = this.plannedMealRepository.create({
                        mealType: mealDto.mealType,
                        time: mealDto.time,
                        dayPlan: dayPlan
                    });

                    // Si se proporcionan dishIds, agregar los dishes
                    if (mealDto.dishIds && mealDto.dishIds.length > 0) {
                        const dishes = await this.dishRepository.find({ where: { id: In(mealDto.dishIds) } });
                        if (dishes.length !== mealDto.dishIds.length) {
                            throw new BadRequestException('Algunos dishes no existen');
                        }
                        plannedMeal.dishes = dishes;
                    }

                    return plannedMeal;
                })
            );

            dayPlan.plannedMeals = plannedMeals;
        }

        return this.dayPlanRepository.save(dayPlan);
    }

    async findAllDayPlans(): Promise<DayPlan[]> {
        return this.dayPlanRepository.find({
            relations: {
                plannedMeals: {
                    dishes: true
                }
            },
            order: {
                date: 'DESC'
            }
        });
    }

    async findDayPlanByDate(date: string): Promise<DayPlan | null> {
        return this.dayPlanRepository.findOne({
            where: { date }
        });
    }

    async findDayPlanById(id: string): Promise<DayPlan | null> {
        return this.dayPlanRepository.findOne({
            where: { id }
        });
    }

    async removeDayPlan(id: string): Promise<void> {
        const dayPlan = await this.dayPlanRepository.findOne({
            where: { id }
        });

        if (!dayPlan) {
            throw new NotFoundException(`DayPlan con ID ${id} no encontrado`);
        }

        await this.dayPlanRepository.remove(dayPlan);
    }

    // planned meal

    async addPlannedMeal(
        dayPlanId: string,
        createPlannedMealDto: CreatePlannedMealDto
    ): Promise<PlannedMeal> {
        const dayPlan = await this.dayPlanRepository.findOne({
            where: { id: dayPlanId }
        });

        if (!dayPlan) {
            throw new NotFoundException(`DayPlan con ID ${dayPlanId} no encontrado`);
        }

        const plannedMeal = this.plannedMealRepository.create({
            mealType: createPlannedMealDto.mealType,
            time: createPlannedMealDto.time,
            dayPlan: dayPlan
        });

        // Si se proporcionan dishIds, agregar los dishes
        if (createPlannedMealDto.dishIds && createPlannedMealDto.dishIds.length > 0) {
            const dishes = await this.dishRepository.find({ where: { id: In(createPlannedMealDto.dishIds) } });
            if (dishes.length !== createPlannedMealDto.dishIds.length) {
                throw new BadRequestException('Algunos dishes no existen');
            }
            plannedMeal.dishes = dishes;
        }

        return this.plannedMealRepository.save(plannedMeal);
    }

    async updatePlannedMeal(id: string, updatePlannedMealDto: UpdatePlannedMealDto): Promise<PlannedMeal> {
        const plannedMeal = await this.plannedMealRepository.findOne({
            where: { id }
        });

        if (!plannedMeal) {
            throw new NotFoundException(`PlannedMeal con ID ${id} no encontrado`);
        }

        // Actualizar solo los campos proporcionados
        if (updatePlannedMealDto.mealType !== undefined) {
            plannedMeal.mealType = updatePlannedMealDto.mealType;
        }

        if (updatePlannedMealDto.time !== undefined) {
            plannedMeal.time = updatePlannedMealDto.time;
        }

        return this.plannedMealRepository.save(plannedMeal);
    }

    async removePlannedMeal(id: string): Promise<void> {
        const plannedMeal = await this.plannedMealRepository.findOne({
            where: { id }
        });

        if (!plannedMeal) {
            throw new NotFoundException(`PlannedMeal con ID ${id} no encontrado`);
        }

        await this.plannedMealRepository.remove(plannedMeal);
    }

    // dish

    async createDish(createDishDto: CreateDishDto): Promise<Dish> {
        // Validar que no exista un dish con el mismo nombre
        const existingDish = await this.dishRepository.findOne({
            where: { name: createDishDto.name }
        });

        if (existingDish) {
            throw new BadRequestException(
                `Ya existe un dish con el nombre "${createDishDto.name}"`
            );
        }

        const dish = this.dishRepository.create(createDishDto);
        return this.dishRepository.save(dish);
    }

    async findAllDishes(): Promise<Dish[]> {
        return this.dishRepository.find({
            order: { name: 'ASC' }
        });
    }

    async findDishById(id: string): Promise<Dish | null> {
        const dish = await this.dishRepository.findOne({
            where: { id }
        });

        if (!dish) {
            throw new NotFoundException(`Dish con ID ${id} no encontrado`);
        }

        return dish;
    }

    async updateDish(id: string, updateDishDto: UpdateDishDto): Promise<Dish> {
        const dish = await this.dishRepository.findOne({
            where: { id }
        });

        if (!dish) {
            throw new NotFoundException(`Dish con ID ${id} no encontrado`);
        }

        // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
        if (updateDishDto.name && updateDishDto.name !== dish.name) {
            const existingDish = await this.dishRepository.findOne({
                where: { name: updateDishDto.name }
            });

            if (existingDish) {
                throw new BadRequestException(
                    `Ya existe un dish con el nombre "${updateDishDto.name}"`
                );
            }
        }

        Object.assign(dish, updateDishDto);
        return this.dishRepository.save(dish);
    }

    async removeDish(id: string): Promise<void> {
        const dish = await this.dishRepository.findOne({
            where: { id }
        });

        if (!dish) {
            throw new NotFoundException(`Dish con ID ${id} no encontrado`);
        }

        // Eliminar el dish de todos los PlannedMeals donde esté asociado
        await this.plannedMealRepository
            .createQueryBuilder()
            .relation(PlannedMeal, 'dishes')
            .of(null) // Esto elimina todas las relaciones
            .remove(dish.id);

        await this.dishRepository.remove(dish);
    }

    // dish to planned meal

    async addDishesToPlannedMeal(plannedMealId: string, dishIds: string[]): Promise<PlannedMeal> {
        const plannedMeal = await this.plannedMealRepository.findOne({
            where: { id: plannedMealId },
            relations: { dishes: true }
        });

        if (!plannedMeal) {
            throw new NotFoundException(`PlannedMeal con ID ${plannedMealId} no encontrado`);
        }

        // Obtener los dishes
        const dishes = await this.dishRepository.find({ where: { id: In(dishIds) } });

        if (dishes.length !== dishIds.length) {
            const foundIds = dishes.map(d => d.id);
            const missingIds = dishIds.filter(id => !foundIds.includes(id));
            throw new BadRequestException(
                `Los siguientes dishes no existen: ${missingIds.join(', ')}`
            );
        }

        // Agregar los nuevos dishes sin duplicar
        const existingDishIds = new Set(plannedMeal.dishes.map(d => d.id));
        const newDishes = dishes.filter(d => !existingDishIds.has(d.id));

        plannedMeal.dishes.push(...newDishes);

        return this.plannedMealRepository.save(plannedMeal);
    }

    async removeDishFromPlannedMeal(
        plannedMealId: string,
        dishId: string
    ): Promise<void> {
        const plannedMeal = await this.plannedMealRepository.findOne({
            where: { id: plannedMealId },
            relations: { dishes: true }
        });

        if (!plannedMeal) {
            throw new NotFoundException(`PlannedMeal con ID ${plannedMealId} no encontrado`);
        }

        // Verificar que el dish existe en el plannedMeal
        const dishExists = plannedMeal.dishes.some(d => d.id === dishId);
        if (!dishExists) {
            throw new BadRequestException(
                `El dish con ID ${dishId} no está asociado a este PlannedMeal`
            );
        }

        // Remover el dish
        plannedMeal.dishes = plannedMeal.dishes.filter(d => d.id !== dishId);

        // Si no quedan dishes, eliminar automáticamente el PlannedMeal
        if (plannedMeal.dishes.length === 0) {
            await this.plannedMealRepository.remove(plannedMeal);
        } else {
            await this.plannedMealRepository.save(plannedMeal);
        }
    }

    async addPlannedMealByDate(
        date: string,
        createPlannedMealDto: CreatePlannedMealDto
    ): Promise<PlannedMeal> {
        // Buscar DayPlan por fecha
        let dayPlan = await this.dayPlanRepository.findOne({
            where: { date }
        });

        // Si no existe, crearlo
        if (!dayPlan) {
            dayPlan = this.dayPlanRepository.create({ date });
            dayPlan = await this.dayPlanRepository.save(dayPlan);
        }

        const plannedMeal = this.plannedMealRepository.create({
            mealType: createPlannedMealDto.mealType,
            time: createPlannedMealDto.time,
            dayPlan: dayPlan
        });

        // Si se proporcionan dishIds, agregar los dishes
        if (createPlannedMealDto.dishIds && createPlannedMealDto.dishIds.length > 0) {
            const dishes = await this.dishRepository.find({ where: { id: In(createPlannedMealDto.dishIds) } });
            if (dishes.length !== createPlannedMealDto.dishIds.length) {
                throw new BadRequestException('Algunos dishes no existen');
            }
            plannedMeal.dishes = dishes;
        }

        return this.plannedMealRepository.save(plannedMeal);
    }

    async addPlannedMealRange(data: CreatePlannedMealRangeDto): Promise<PlannedMeal[]> {
        const { startDate, endDate, time, mealType, dishIds } = data;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const plannedMeals: PlannedMeal[] = [];

        // Obtener los dishes una sola vez
        const dishes = await this.dishRepository.find({ where: { id: In(dishIds) } });
        if (dishes.length !== dishIds.length) {
            throw new BadRequestException('Algunos dishes no existen');
        }

        let currentDate = new Date(start);

        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];

            // Buscar o crear DayPlan para esta fecha
            let dayPlan = await this.dayPlanRepository.findOne({
                where: { date: dateStr }
            });

            if (!dayPlan) {
                dayPlan = this.dayPlanRepository.create({ date: dateStr });
                dayPlan = await this.dayPlanRepository.save(dayPlan);
            }

            const plannedMeal = this.plannedMealRepository.create({
                mealType: mealType,
                time: time,
                dayPlan: dayPlan,
            });

            plannedMeal.dishes = dishes;
            plannedMeals.push(plannedMeal);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return this.plannedMealRepository.save(plannedMeals);
    }
}