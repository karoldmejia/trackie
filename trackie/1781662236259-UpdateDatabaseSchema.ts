import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDatabaseSchema1781662236259 implements MigrationInterface {
    name = 'UpdateDatabaseSchema1781662236259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_logs" RENAME COLUMN "energyDrinks" TO "proteinGrams"`);
        await queryRunner.query(`ALTER TABLE "weight_logs" RENAME COLUMN "skeletalMuscle" TO "hips"`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "startWeight" double precision NOT NULL DEFAULT '70'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "startWeight"`);
        await queryRunner.query(`ALTER TABLE "weight_logs" RENAME COLUMN "hips" TO "skeletalMuscle"`);
        await queryRunner.query(`ALTER TABLE "daily_logs" RENAME COLUMN "proteinGrams" TO "energyDrinks"`);
    }

}
