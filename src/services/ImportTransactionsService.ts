import csvParse from 'csv-parse';
import { response } from 'express';
import fs from 'fs';
import { In, getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';

import Category from '../models/Category'
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository)
    const categoryRepository = getRepository(Category)
    const contactsReadStream = fs.createReadStream(filePath);

    const parser = csvParse({
      from_line: 2,
    }) 

    const parseCSV = contactsReadStream.pipe(parser)

    const transactions: CSVTransaction[]=[];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
      cell.trim(),
      );

      if (!title ||!type || !value) return

      categories.push(category);
      transactions.push({title, type, value, category});
    });
    await new Promise(resolve => parseCSV.on('end', resolve))

    const currentCategories = await categoryRepository.find({
      where: {
        title: In(categories)
      }
    })

    const currentCategoriesTitles = currentCategories.map(
      (category: Category) => category.title);

    const addCategoriesTitles = categories
    .filter(category => !currentCategoriesTitles.includes(category))
    .filter((value, index, self) => self.indexOf(value)=== index) 

    const newCategories = categoryRepository.create(
      addCategoriesTitles.map(title => ({
        title
      }))
    )

    await categoryRepository.save(newCategories)

    const finalCategories = [... newCategories, ...currentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category
        ),
      }))
    )
    
    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions
    //return {transactions, categories}
  }
  
}

export default ImportTransactionsService;
