import {
  BadRequestException,
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Scope,
  Type,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { ClassConstructor, instanceToPlain } from "class-transformer";
import { Request } from "express";
import {
  EntityFields,
  FindManyOptions,
  FindOneOptions,
  IBaseRepository,
  PaginatedData,
} from "@rosariomassango/nestjs-libs/repository";
import { CrudConfig } from "./interfaces/crud-config.interface";
import { ICrudController } from "./interfaces/crud.interface";
import { AbstractValidationPipe } from "./pipes/abstract-validation.pipe";

import { REQUEST } from "@nestjs/core";
import { FilesInterceptor } from "@nestjs/platform-express";

export function CrudFactory<T>(
  createDto?: ClassConstructor<any>,
  updateDto?: ClassConstructor<any>
): Type<ICrudController<T>> {
  const createPipe = new AbstractValidationPipe(
    { whitelist: true, transform: true, stopAtFirstError: true },
    { body: createDto }
  );
  const updatePipe = new AbstractValidationPipe(
    { whitelist: true, transform: true, stopAtFirstError: true },
    { body: updateDto }
  );

  @Injectable({ scope: Scope.REQUEST })
  class CrudController implements ICrudController<T> {
    @Inject(REQUEST) private req: Request;

    private repository: IBaseRepository<T>;
    private config: CrudConfig<T>;

    constructor(config: CrudConfig<T>) {
      this.config = config;
      this.repository = config?.repository;
    }

    @Post()
    @UsePipes(createPipe)
    //  @UseInterceptors(
    //    FilesInterceptor("files")
    //    // new IsUniqueInterceptor(createDto)
    //  )
    @HttpCode(HttpStatus.CREATED)
    async create(
      @Body() createDto: any,
      // @UploadedFiles(new FileValidationPipe({ fileType: FileType.image }))
      files?: Array<File>
    ): Promise<any> {
      // Custom logic before create
      if (this.config.beforeCreate) {
        createDto = await this.config.beforeCreate(createDto, files);
      }

      const response = await this.repository.create(
        instanceToPlain(createDto) as any
      );
      return { message: "Item created successfully", data: response };
    }

    @Get()
    async findAll(@Query() queryParams: any): Promise<PaginatedData<T>> {
      const { page, limit } = queryParams;

      delete queryParams.page;
      delete queryParams.limit;

      // Custom logic before findAll
      //Search Filters
      const { src } = queryParams;
      delete queryParams.src;

      const searchQuery: EntityFields<T>[] = [];

      if (src && this.config.searchKeys) {
        for (const key of this.config.searchKeys) {
          searchQuery.push({ [key]: src } as EntityFields<T>);
        }
      }

      //Where Filters
      let query: FindManyOptions<T> = {
        where: queryParams,
        orWhere: searchQuery,
      };

      //Execute before methods
      if (this.config.beforeFindAll) {
        query = await this.config.beforeFindAll(query, this.req ?? null);
      }

      return await this.repository.paginate(query);
    }

    @Get("/:id")
    async findOne(
      @Param("id") id: string,
      @Query() queryParams: any
    ): Promise<any> {
      let query: FindOneOptions<T> = {
        where: {
          id,
          ...queryParams,
        } as any,
      };

      // Custom logic before findOne
      if (this.config.beforeFindOne) {
        query = await this.config.beforeFindOne(query, this.req);
      }

      const data = await this.repository.findOne(query);
      if (!data) throw new NotFoundException("Item not found");

      return { data };
    }

    @Patch("/:id")
    @UsePipes(updatePipe)
    @UseInterceptors(
      FilesInterceptor("files")
      // new IsUniqueInterceptor(updateDto)
    )
    async update(
      @Param("id") id: string,
      @Body() updateDto: any,
      // @UploadedFiles(new FileValidationPipe({ fileType: FileType.image }))
      files?: Array<File>
    ): Promise<any> {
      // Custom logic before update
      if (this.config.beforeUpdate) {
        updateDto = await this.config.beforeUpdate(updateDto, files, this.req);
      }

      const data = await this.repository.update({
        where: { id } as any,
        data: instanceToPlain(updateDto) as any,
      });

      if (!data) throw new NotFoundException("Item not found for update");
      return { message: "Item updated successfully", data };
    }

    @Delete()
    async delete(@Query("id") ids: string[]): Promise<any> {
      if (!ids || ids.length <= 0) {
        throw new BadRequestException("No ids found");
      }

      // Custom logic before delete
      if (this.config.beforeDelete) {
        ids = await this.config.beforeDelete(ids);
      }

      const deleted = await this.repository.delete({
        where: { id: ids } as any,
      });
      // if (deleted.length === 0)
      //   throw new BadRequestException("No items deleted");
      return { message: `${deleted.length} items deleted successfully` };
    }
  }

  return CrudController;
}
