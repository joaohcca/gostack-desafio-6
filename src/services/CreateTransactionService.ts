// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository'


import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';
import { json } from 'express';

interface Request {
  title: 'string',
  type: 'income' | 'outcome',
  value: number,
  category: string
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository)
    const categoryRepository = getRepository(Category)

    const { total } = await transactionRepository.getBalance();

    if ( type === 'outcome' && total < value ) {
        throw new AppError('Inssuficient Balance to complete')
    }

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category
      }
    })

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category
      })

      await categoryRepository.save(transactionCategory)
    }
      
    
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: transactionCategory,
      category_id: transactionCategory.id
    })

    await transactionRepository.save(transaction)

    return transaction
  }
}

export default CreateTransactionService;
