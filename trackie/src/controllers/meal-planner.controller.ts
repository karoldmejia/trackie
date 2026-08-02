import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { CreateDayPlanDto } from '../dtos/day-plan.dto';
import { CreateDishDto, UpdateDishDto } from '../dtos/dish.dto';
import { AddDishesToPlannedMealDto, CreatePlannedMealDto, UpdatePlannedMealDto } from '../dtos/planned-meal.dto';
import { DayPlan } from '../entities/day-plan.entity';
import { Dish } from '../entities/dish.entity';
import { PlannedMeal } from '../entities/planned-meal.entity';
import { MealPlannerService } from '../services/meal-planner.service';

@Controller('meal-planner')
export class MealPlannerController {
    constructor(private readonly mealPlannerService: MealPlannerService) { }


    @Post('day-plan')
    async createDayPlan(@Body() createDayPlanDto: CreateDayPlanDto): Promise<DayPlan> {
        return this.mealPlannerService.createDayPlan(createDayPlanDto);
    }

    @Get('day-plan')
    async findAllDayPlans(): Promise<DayPlan[]> {
        return this.mealPlannerService.findAllDayPlans();
    }

    @Get('day-plan/date/:date')
    async findDayPlanByDate(@Param('date') date: string): Promise<DayPlan | null> {
        return this.mealPlannerService.findDayPlanByDate(date);
    }

    @Get('day-plan/:id')
    async findDayPlanById(@Param('id', ParseUUIDPipe) id: string): Promise<DayPlan | null> {
        return this.mealPlannerService.findDayPlanById(id);
    }

    @Delete('day-plan/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeDayPlan(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.mealPlannerService.removeDayPlan(id);
    }

    @Post('date/:date/planned-meal')
    async addPlannedMealByDate(
        @Param('date') date: string,
        @Body() createPlannedMealDto: CreatePlannedMealDto
    ): Promise<PlannedMeal> {
        return this.mealPlannerService.addPlannedMealByDate(date, createPlannedMealDto);
    }

    // planned meal endpoints

    @Post('day-plan/:dayPlanId/planned-meal')
    async addPlannedMeal(@Param('dayPlanId', ParseUUIDPipe) dayPlanId: string, @Body() createPlannedMealDto: CreatePlannedMealDto): Promise<PlannedMeal> {
        return this.mealPlannerService.addPlannedMeal(dayPlanId, createPlannedMealDto);
    }

    @Post('planned-meals/range')
    @HttpCode(HttpStatus.CREATED)
    async addPlannedMealRange(@Body() data: { startDate: string; endDate: string; time: string; mealType: string; dishIds: string[] },): Promise<PlannedMeal[]> {
        try {
            const result = await this.mealPlannerService.addPlannedMealRange(data);
            return result;
        } catch (error) {
            throw error;
        }
    }


    @Put('planned-meal/:id')
    async updatePlannedMeal(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updatePlannedMealDto: UpdatePlannedMealDto
    ): Promise<PlannedMeal> {
        return this.mealPlannerService.updatePlannedMeal(id, updatePlannedMealDto);
    }

    @Delete('planned-meal/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removePlannedMeal(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.mealPlannerService.removePlannedMeal(id);
    }

    // dish endpoints

    @Post('dish')
    async createDish(@Body() createDishDto: CreateDishDto): Promise<Dish> {
        return this.mealPlannerService.createDish(createDishDto);
    }

    @Get('dish')
    async findAllDishes(): Promise<Dish[]> {
        return this.mealPlannerService.findAllDishes();
    }

    @Get('dish/:id')
    async findDishById(@Param('id', ParseUUIDPipe) id: string): Promise<Dish | null> {
        return this.mealPlannerService.findDishById(id);
    }

    @Put('dish/:id')
    async updateDish(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDishDto: UpdateDishDto
    ): Promise<Dish> {
        return this.mealPlannerService.updateDish(id, updateDishDto);
    }

    @Delete('dish/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeDish(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.mealPlannerService.removeDish(id);
    }

    // dish to planned meal endpoints

    @Post('planned-meal/:plannedMealId/dishes')
    async addDishesToPlannedMeal(@Param('plannedMealId', ParseUUIDPipe) plannedMealId: string, @Body() addDishesDto: AddDishesToPlannedMealDto): Promise<PlannedMeal> {
        return this.mealPlannerService.addDishesToPlannedMeal(plannedMealId, addDishesDto.dishIds);
    }

    @Delete('planned-meal/:plannedMealId/dish/:dishId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeDishFromPlannedMeal(
        @Param('plannedMealId', ParseUUIDPipe) plannedMealId: string,
        @Param('dishId', ParseUUIDPipe) dishId: string
    ): Promise<void> {
        await this.mealPlannerService.removeDishFromPlannedMeal(plannedMealId, dishId);
    }
}