import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    // scrypt hash stored as "salt:hash" (hex) — see src/lib/auth.ts. Never the plain password.
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;
export const User: Model<UserDoc> = models.User || model("User", UserSchema);
