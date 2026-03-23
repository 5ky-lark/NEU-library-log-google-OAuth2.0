import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAdminAccount extends Document {
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAccountSchema = new Schema<IAdminAccount>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const AdminAccount: Model<IAdminAccount> =
  mongoose.models.AdminAccount ||
  mongoose.model<IAdminAccount>("AdminAccount", AdminAccountSchema);

export default AdminAccount;
