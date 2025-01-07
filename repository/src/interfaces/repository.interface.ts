/* eslint-disable @typescript-eslint/no-unused-vars */
type WhereFilterOps = {
  $lessThan?: number;
  $lessThanOrEqual?: number;
  $greaterThan?: number;
  $greaterThanOrEqual?: number;
  $in?: Array<unknown>;
  $notIn?: Array<unknown>;
  $not?: string | boolean;
  $arrayContains?: string;
};

export type Unique = {
  data?: object;
  fields: Array<string>;
  where?: object;
  message?: string;
};

export type Options = {
  exclude?: Array<string>;
};

export type EntityFields<Entity> = {
  [P in keyof Entity]?: Entity[P] | WhereFilterOps;
};
export type WhereOptions<Entity> = EntityFields<Entity>;
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface Relations<Entity> {
  collection: unknown;

  /** The label that will be puted as root key of the relation */
  collectionLabel: string;

  localField: string;
  foreignField: string;
  justOne?: boolean;
  options?: Omit<QueryOptions<Entity>, "relations" | "with">;
}

export interface WithRefs {
  name: string;
  doc: unknown;
}

export interface WithReference {
  collection: unknown | string;

  /** The label that will be puted as root key of the reference */
  collectionLabel?: string;

  /** The local field where the reference will be */
  field: string;

  /** Recieve an object key to extract data */
  extractFrom?: string;

  with?: { getFromField: string } & WithReference;
}

// type SelectFieldsObject<Entity> = {
//    [P in keyof Entity]?: boolean;
// };

/** Make a referance relationship */
export interface QueryOptions<Entity> {
  where?: EntityFields<Entity>;
  orWhere?: Array<EntityFields<Entity>>;
  select?: Array<keyof Entity>;
  include?: Array<unknown>;

  // {
  //    [P in keyof Entity]?: boolean;
  // };

  /** Set reference to an document */
  // with?: Array<WithReference>;

  /** Get docuemnt references by name */

  /** Set relations with others collections */
  relations?: Array<Relations<Entity>>;
}

export interface ConfigRepo<T> {
  service?: unknown;
  collectionPrefix?: string;
  collection: string;
  disableCollectionPrefix?: boolean;
  collectionLevel?: string;
  request?: Request;
  auth?: unknown;
  onCollectionInit?: (
    options: Omit<ConfigRepo<T>, "onCollectionInit">
  ) => unknown;
}

export interface GetCollectionPathParams {
  membership: unknown;
  role: string;
}

export interface PaginatedData<Entity> {
  data: Entity[];
  totalItems: number;
  totalPages?: number;
  page: number;
  limit: number;
}

export type InsertParams<Entity> = Omit<
  Entity,
  "id" | "created_at" | "updated_at"
>;

export interface InsertByRefs<Entity> {
  ref: unknown;
  data: InsertParams<Entity>;
}

export interface UpdateParams<Entity> extends QueryOptions<Entity> {
  data: Partial<InsertParams<Entity>>;
  where: EntityFields<Entity>;
}

export type FindOneOptions<Entity> = QueryOptions<Entity>;
export type FindOneByIdOptions<Entity> = Omit<FindOneOptions<Entity>, "">;

export interface FindOneOrFailOptions<Entity> extends QueryOptions<Entity> {
  throwError: string;
}

export type FindManyOptions<Entity> = QueryOptions<Entity>;

export type ToWhereFilterResult = {
  field: string;
  fieldValue: string;
  aritmeticOps: string;
};

export type EntityReturn<Entity> = Entity & {
  id: string;
  created_at: string;
  updated_at: string;
};

export interface BulkWriteParams<Entity> {
  data: Partial<InsertParams<Entity>>;
  upsert?: boolean;
}

export class BulkWriteUpdateByRef<Entity> {
  constructor(
    public params: {
      collection: unknown;
      docId: string;
      update?: BulkWriteParams<Entity> & Pick<QueryOptions<Entity>, "select">;
    }
  ) {}
}

// export type BulkWriteRefParams = {
//    docRef: FirestoreDocument;
// };
export abstract class BulkWrite<Entity> {
  collection?: unknown;
  update?: BulkWriteParams<Entity> & QueryOptions<Entity>;
  insert?: { data: InsertParams<Entity> };
}
