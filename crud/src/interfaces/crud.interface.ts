/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import { PaginatedData } from "@rosariomassango/nestjs-libs/repository";

type CrudReponse<T> = {
  data?: T;
  message?: string;
};

export interface ICrudController<T> {
  create(createDto: any, files?: any[]): Promise<CrudReponse<T>>;
  findAll(query: any): Promise<PaginatedData<T>>;
  findOne(id: string, query: any): Promise<CrudReponse<T>>;
  update(id: string, updateDto: any, files?: any[]): Promise<CrudReponse<T>>;
  delete(ids: string[]): Promise<CrudReponse<T>>;
}
