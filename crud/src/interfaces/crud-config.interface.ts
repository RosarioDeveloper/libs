import { ConfigRepo, FindManyOptions, IBaseRepository } from "@rosariomassango/nestjs-libs/repository";
import { Request } from "express";

export interface ICrudEvent<Entity> {
  /** This method is called before create data  */
  beforeCreate?: (body: any, files?: any[], request?: Request) => Promise<any>;

  /** This method is called before update data */
  beforeUpdate?: (body: any, files?: any[], request?: Request) => Promise<any>;

  /** This method is called before delete data  */
  beforeDelete?: (
    ids: Array<string>,
    request?: Request
  ) => Promise<Array<string>>;

  /** This method is called before findAll data  */
  beforeFindAll?: (
    queryParams: FindManyOptions<Entity>,
    request?: Request
  ) => Promise<FindManyOptions<Entity>>;

  /** This method is called before findAll data and merge the queryParams from request   */
  // onFindAllQuery?: (query: any) => Promise<object>;

  /** This method is called before findOne data  */
  beforeFindOne?: (
    queryParams: FindManyOptions<Entity>,
    request?: Request
  ) => Promise<any>;

  /** This method is called before findAll data and merge the queryParams from request   */
  // onFindOneQuery?: (query: any) => Promise<any>;
}

export interface CrudConfig<Entity>
  extends ICrudEvent<Entity>,
    Partial<ConfigRepo<Entity>> {
  repository: IBaseRepository<Entity>;

  searchKeys?: (keyof Entity)[];
}
