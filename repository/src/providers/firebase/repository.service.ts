/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  FirestoreCollection,
  FirestoreDocument,
  FirestoreDocumentReference,
  FirestoreQuery,
  FirestoreQuerySnapshot,
} from "@libs/firebase";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { whereFilterOps } from "../../filters";
import {
  BulkWrite,
  BulkWriteParams,
  BulkWriteUpdateByRef,
  FindManyOptions,
  PaginatedData,
  PaginationOptions,
  QueryOptions,
  Relations,
  WithReference,
} from "../../interfaces/repository.interface";

@Injectable()
export class RepositoryService<Entity> {
  private db: Firestore;
  constructor(db: Firestore) {
    this.db = db;
  }

  pathToCollectionOrDocument(
    database: Firestore,
    collectionPath: string
  ): FirestoreCollection | FirestoreDocumentReference {
    const pathArr = collectionPath.split("/");
    if (pathArr.length === 0) {
      throw new InternalServerErrorException(
        "Collection path must not be empty."
      );
    }

    let currentRef: FirestoreCollection | FirestoreDocumentReference =
      database.collection(pathArr[0]);

    pathArr.slice(1).forEach((path, i) => {
      const isDocument = i % 2 === 0;

      if (isDocument) {
        currentRef = (currentRef as FirestoreCollection).doc(path);
      } else {
        currentRef = (currentRef as FirestoreDocumentReference).collection(
          path
        );
      }
    });

    return currentRef as FirestoreCollection | FirestoreDocumentReference;
  }

  async serializeDocs(
    snapshot: FirestoreQuerySnapshot
  ): Promise<Array<Entity>> {
    return await new Promise(resolve => {
      const newDocs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<Entity>;

      resolve(newDocs);
    });
  }

  private toWhere(obj: any): Filter[] {
    const fields = Object.keys(obj);
    const filters = fields.map(key => {
      if (obj[key] && obj[key] != "") {
        let [aritmeticOps, fieldValue] = ["==", obj[key]];

        //Get operation expression
        if (typeof obj[key] == "object") {
          [aritmeticOps, fieldValue] = Object.entries(obj[key])[0];
          aritmeticOps = whereFilterOps.get(aritmeticOps);
        }

        // return { field: key, fieldValue, aritmeticOps };
        return Filter.where(key, aritmeticOps as any, fieldValue);
      }
    });

    return filters.filter(filter => filter !== undefined);
  }

  private toOrWhere(arrObj: Array<any>): Filter[] {
    return arrObj.map(obj => {
      return this.toWhere(obj)[0];
    });
  }

  buildQuery(query: FirestoreQuery, options: QueryOptions<Entity>) {
    if (options?.where) {
      query = query.where(Filter.and(...this.toWhere(options?.where)));
    }

    if (options?.orWhere) {
      query = query.where(Filter.or(...this.toOrWhere(options?.orWhere)));
    }

    if (options?.select) {
      query = query.select(...(options.select as any[]));
    }

    return query;
  }

  async pagination(
    query: FirestoreCollection | FirestoreQuery,
    option: PaginationOptions
  ): Promise<PaginatedData<Entity>> {
    const page = Number(option?.page ?? 1) <= 0 ? 1 : Number(option?.page ?? 1);
    const limit = Number(option?.limit ?? 10);

    const paginateData: PaginatedData<Entity> = {
      data: [],
      totalItems: 0,
      page,
      limit,
    };

    paginateData.totalItems = (await query.count().get()).data().count;

    paginateData.totalPages = Math.ceil(paginateData.totalItems / limit);

    const isInRange = page <= paginateData.totalPages;

    if (!isInRange) {
      paginateData.data = [];
      return paginateData;
    }

    const offset = (page - 1) * limit;

    //Next
    const snapshot = await query
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(limit)
      .get();

    paginateData.data = await this.serializeDocs(snapshot);
    return paginateData;
  }

  async get(
    collection: FirestoreCollection,
    options?: FindManyOptions<Entity>
  ): Promise<Array<Entity>> {
    const query: FirestoreCollection | FirestoreQuery = this.buildQuery(
      collection,
      options
    );

    return await this.serializeDocs(await query.get());
  }

  // Async function to update bulk documents in a Firestore collection using a BulkWriter instance
  async updateBulk(
    bulkWriter: BulkWriter,
    collection: FirestoreCollection,
    options: BulkWrite<Entity>[]
  ) {
    // Reduce the options array to extract conditions (orWhere and select)
    const conditions = options.reduce(
      (curr, { update }) => {
        if (!update) return;

        // Add conditions to orWhere array and select array
        curr.orWhere.push(update?.where ?? {}, ...(update?.orWhere ?? []));
        if (update?.select?.length > 0) {
          curr.select.push(...update?.select.filter(s => s));
        }
        return curr;
      },
      { orWhere: [], select: [] } as FindManyOptions<Entity>
    );

    let filteredData: Entity[] = [];
    if (conditions?.orWhere.length > 0) {
      filteredData = await this.get(collection, conditions);
    }

    // Function to add bulk operations (upsert or update) to the BulkWriter
    const bulkAdd = (
      collection: FirestoreCollection,
      docId: string,
      opt: BulkWriteParams<Entity>
    ) => {
      const docRef = this.getDocRef(collection, docId);
      if (!docRef) return;

      if (opt?.upsert) {
        opt.data["created_at"] = new Date().toISOString();
        bulkWriter.set(docRef, opt?.data, { merge: true });
        return;
      }

      opt.data["updated_at"] = new Date().toISOString();
      bulkWriter.update(docRef, opt?.data);
    };

    // Function to perform bulk update for each option
    const bulkUpdate = async (opt: BulkWrite<Entity>) => {
      const [key, keyValue] = Object.entries(opt.update.where)[0];
      const data: any = filteredData.find((item: any) => item?.id === keyValue);

      if (!data?.id && !opt.update?.upsert) return;
      bulkAdd(collection, data?.id, opt.update);
    };

    // Function to perform bulk update by document reference
    const bulkUpdateByRef = (ops: BulkWriteUpdateByRef<Entity>) => {
      const { collection, docId, update } = ops.params;
      bulkAdd(collection, docId, update);
    };

    return {
      update: bulkUpdate,
      updateByRef: bulkUpdateByRef,
    };
  }

  getDocRef(collection: FirestoreCollection, doc?: string): FirestoreDocument {
    try {
      return collection.doc(doc);
    } catch (error) {
      return collection.doc();
    }
  }

  async getRelations(
    parentData: Array<any>,
    options?: QueryOptions<Entity>
  ): Promise<Entity[]> {
    if (options?.relations) {
      parentData = await this.relations(parentData, options?.relations);
    }

    if (options?.with) {
      parentData = await this.with(parentData, options?.with);
    }

    return parentData;
  }

  private async relations(
    parentData: Array<Entity>,
    relations: Array<Relations<Entity>>
  ) {
    try {
      for await (const relation of relations) {
        // Set where filters
        let filters = parentData.map(obj => {
          if (obj[relation.localField]) {
            if (Array.isArray(obj[relation.localField])) {
              return {
                [relation.foreignField]: {
                  $in: obj[relation.localField],
                },
              };
            }
            return { [relation.foreignField]: obj[relation.localField] };
          }
        });
        filters = filters.filter(e => !!e);

        //Get data by where filters
        const resultData = await this.get(relation.collection, {
          orWhere: filters as any,
        });

        /** Takes all results and assigns them appropriately to each entity.
         * Comparing the 'localField' in the entity with the 'foreignField' in each result. */
        parentData = parentData.map(entity => {
          if (Array.isArray(entity[relation.localField])) {
            entity[relation.collectionLabel] = (
              entity[relation.localField] as Array<any>
            ).map(field =>
              resultData.find(r => r[relation.foreignField] === field)
            );
            return entity;
          }

          entity[relation.collectionLabel] = resultData.find(
            r => r[relation.foreignField] === entity[relation.localField]
          );
          return entity;
        });
      }

      return parentData;
    } catch (error) {
      throw new InternalServerErrorException("Error on relations.");
    }
  }

  private async with(
    parentData: Array<Entity>,
    references: Array<WithReference>
  ) {
    const getAllData = async (
      refData: WithReference,
      docRefs: Array<FirestoreDocumentReference>,
      parentDocs: Array<any>
    ) => {
      const snapshot = await this.db.getAll(...docRefs);

      const shotData = snapshot.map(shot => ({
        id: shot.id,
        ...shot.data(),
      }));

      parentDocs.forEach(async doc => {
        if (Array.isArray(doc[refData.field])) {
          doc[refData.collectionLabel] = (doc[refData.field] as Array<any>).map(
            field => shotData.find(r => r.id === field)
          );
        } else {
          doc[refData.collectionLabel] = shotData.find(
            r => r.id === doc[refData.field]
          );
        }

        // Handle nested 'with'
        if (refData.with) {
          const nestedRefs: Array<any> = [];
          const nestedParentDocs: Array<any> = [];

          if (Array.isArray(doc[refData.collectionLabel])) {
            (doc[refData.collectionLabel] as Array<any>).forEach(
              (nestedDoc: any) => {
                const nestedDocId = nestedDoc[refData.with?.field];
                if (nestedDocId) {
                  nestedRefs.push(
                    (refData.with?.collection as FirestoreCollection).doc(
                      nestedDocId
                    )
                  );
                  nestedParentDocs.push(nestedDoc);
                }
              }
            );
          } else if (doc[refData.collectionLabel]) {
            const nestedDoc = doc[refData.collectionLabel];
            const nestedDocId = nestedDoc[refData.with?.field];
            if (nestedDocId) {
              nestedRefs.push(
                (refData.with?.collection as FirestoreCollection).doc(
                  nestedDocId
                )
              );
              nestedParentDocs.push(nestedDoc);
            }
          }

          if (nestedRefs.length > 0) {
            await getAllData(refData.with, nestedRefs, nestedParentDocs);
          }
        }
      });
    };

    const getObjectByPath = (obj, path) => {
      const parts = path.split(".");
      let current = obj;
      for (const part of parts) {
        if (current[part] === undefined) {
          return undefined;
        }
        current = current[part];
      }
      return current;
    };

    for (const refData of references) {
      if (typeof refData.collection === "string") {
        refData.collection = this.pathToCollectionOrDocument(
          this.db,
          refData.collection
        ) as FirestoreCollection;
      }

      const docRefs: Array<any> = [];
      parentData.forEach(obj => {
        const docId = getObjectByPath(obj, refData?.field);
        if (docId) {
          if (Array.isArray(docId)) {
            docId.forEach(id =>
              docRefs.push((refData.collection as FirestoreCollection).doc(id))
            );
          } else {
            docRefs.push(
              (refData.collection as FirestoreCollection).doc(docId)
            );
          }
        }
      });

      if (docRefs.length > 0) {
        await getAllData(refData, docRefs, parentData);
      }
    }

    return parentData;
  }
}
