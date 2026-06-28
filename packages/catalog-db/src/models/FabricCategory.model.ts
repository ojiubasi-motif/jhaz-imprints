import { Schema, model, Types } from "mongoose";
import type { IFabricCategory } from "./types";

const fabricCategorySchema = new Schema<IFabricCategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fabrics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Fabric",
      },
    ],
  },
  {
    timestamps: true,
  }
);

fabricCategorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
  }
  next();
});

export const FabricCategory = model<IFabricCategory>("FabricCategory", fabricCategorySchema);
