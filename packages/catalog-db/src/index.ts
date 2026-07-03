// Re-export models
export { Product, Fabric, FabricCategory, Category } from "./models";
export type {
  IProduct,
  IFabric,
  IFabricCategory,
  IFabricProperty,
  ICategoryRef,
  ICategory,
  IStyleOption,
  ISeoMeta,
  FabricUnit,
  Gender,
  Occasion,
} from "./models";

// Re-export connection functions
export { connectMongoDB, disconnectMongoDB, getMongoDBConnection } from "./connection";
