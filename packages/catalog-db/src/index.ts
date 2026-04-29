// Re-export models
export { Product } from "./models";
export type { IProduct, IFabricOption, IColorOption, IStyleOption, ISeoMeta } from "./models";

// Re-export connection functions
export { connectMongoDB, disconnectMongoDB, getMongoDBConnection } from "./connection";
