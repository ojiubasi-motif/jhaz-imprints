// Re-export models
export { Product, Fabric, FabricCategory } from "./models";
export type {
  IProduct,
  IFabric,
  IFabricCategory,
  IFabricProperty,
  ICategoryRef,
  IStyleOption,
  ISeoMeta,
  FabricUnit,
  Gender,
  Occasion,
} from "./models";

// Re-export connection functions
export { connectMongoDB, disconnectMongoDB, getMongoDBConnection } from "./connection";
