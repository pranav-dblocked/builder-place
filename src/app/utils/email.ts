import { User } from '.prisma/client';
import { MAX_TRANSACTION_AMOUNT } from '../../config';
import prisma from '../../postgre/postgreClient';
import {
  ERROR_CHECKING_TRANSACTION_COUNTER,
  TRANSACTION_LIMIT_REACHED,
} from '../../modules/BuilderPlace/apiResponses';
import { logAndReturnApiError } from './handleApiErrors';

export async function checkOrResetTransactionCounter(user: User): Promise<void> {
  try {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const oneWeekAgoSeconds = nowSeconds - 7 * 24 * 60 * 60; // 7 days ago in seconds

    if (user.counterStartDate > oneWeekAgoSeconds) {
      if (user.weeklyTransactionCounter >= MAX_TRANSACTION_AMOUNT) {
        console.log(TRANSACTION_LIMIT_REACHED);
        throw new Error(TRANSACTION_LIMIT_REACHED);
      }
    } else {
      console.log('More than a week since the start date, reset counter');
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          counterStartDate: nowSeconds,
          weeklyTransactionCounter: 0,
        },
      });
    }
    console.log('Delegating transaction');
  } catch (e: any) {
    const error = logAndReturnApiError(e, ERROR_CHECKING_TRANSACTION_COUNTER);
    throw new Error(error);
  }
}

export async function incrementWeeklyTransactionCounter(user: User): Promise<void> {
  try {
    const newWeeklyTransactionCounter = (user.weeklyTransactionCounter = 50
      ? 1
      : (user.weeklyTransactionCounter || 0) + 1);
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        weeklyTransactionCounter: newWeeklyTransactionCounter,
      },
    });
    console.log('Transaction counter incremented', newWeeklyTransactionCounter);
  } catch (e: any) {
    const error = logAndReturnApiError(e, ERROR_CHECKING_TRANSACTION_COUNTER);
    throw new Error(error);
  }
}
