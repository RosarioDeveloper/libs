// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import {
//   FindManyOptions,
//   FindOneOptions,
//   InsertParams,
//   PaginatedData,
//   UpdateParams,
// } from "@rosariomassango/nestjs-libs/repository";
// import { Model, ModelStatic } from "sequelize";
// import { IBaseRepository } from "../../interfaces/base-repository.interface";

// export class SequelizeRepoProvider<T extends Model>
//   implements IBaseRepository<T>
// {
//   private model: ModelStatic<T>;

//   constructor(model: ModelStatic<T>) {
//     this.model = model;
//   }

//   async create(data: InsertParams<T>): Promise<T> {
//     return await this.model.create(data as any);
//   }

//   async findAll(query: FindManyOptions<T>): Promise<T[]> {
//     return await this.model.findAll({
//       include: (query?.include ?? []) as any[],
//     });
//   }

//   async paginate(query?: FindManyOptions<T>): Promise<PaginatedData<T>> {
//     const data = await this.model.findAll({
//       include: (query?.include ?? []) as any[],
//     });

//     return {
//       data: data,
//       totalItems: 0,
//       limit: 10,
//       page: 1,
//       totalPages: 0,
//     };
//   }

//   async findOne(query: FindOneOptions<T>): Promise<T | null> {
//     return await this.model.findOne({
//       where: query.where as any,
//       include: query?.include as any,
//     });
//   }

//   async update(params: UpdateParams<T>): Promise<Partial<T>> {
//     await this.model.update(params.data as any, { where: params.where as any });
//     return params.data as any;
//   }

//   async delete(query: FindOneOptions<T>): Promise<Array<any>> {
//     const response = await this.model.destroy({ where: query.where as any });
//     return [response];
//   }
// }
