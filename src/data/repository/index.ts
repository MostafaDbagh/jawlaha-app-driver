// Aggregated repository — mirrors the customer app's data/repository barrel.
export * from './auth';
export * from './driver';

import { authRepo } from './auth';
import { driverRepo } from './driver';

export const repository = { ...authRepo, ...driverRepo };
