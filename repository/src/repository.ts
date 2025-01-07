/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model } from "sequelize";
import { SequelizeRepoProvider } from "./providers/sequelize/sequelize.provider";

export function BaseRepository<T extends Model>() {
  const providers = {
    sequelize: SequelizeRepoProvider<T>,
  };

  return providers.sequelize;
}
