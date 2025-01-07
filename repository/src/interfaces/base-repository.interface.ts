/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FindManyOptions,
  FindOneOptions,
  InsertParams,
  PaginatedData,
  UpdateParams,
} from "@rosariomassango/nestjs-libs/repository";

export interface IBaseRepository<T> {
  create(data: InsertParams<T>): Promise<T>;
  findOne(query: FindOneOptions<T>): Promise<T | null>;
  findAll(query: FindManyOptions<T>): Promise<T[]>;
  paginate(query?: FindManyOptions<T>): Promise<PaginatedData<T>>;
  update(params: UpdateParams<T>): Promise<Partial<T>>;
  delete(query: FindOneOptions<T>): Promise<any>;
}

// export interface IBaseRepositoryProvider<T> {
//   instance: IBaseRepository<T>;
// }
