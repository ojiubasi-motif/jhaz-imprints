// Re-export models
export { Product, Fabric } from "./models";
export type {
  IProduct,
  IFabric,
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
