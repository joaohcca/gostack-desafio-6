import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class AddCategoryIdToTransactions1606175516264 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.addColumn(
            'transactions',
            new TableColumn({
                name: 'category_id',
                type: 'uuid',
                isNullable: true,
        })
        )
        await queryRunner.createForeignKey('transactions', 
        new TableForeignKey({
            columnNames: ['category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'categories',
            name: 'TransactionCategory',
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
        })
        )
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropForeignKey('transactions','TransactionCategory')
        await queryRunner.dropColumn('transactions', 'category_id')
    }

}
