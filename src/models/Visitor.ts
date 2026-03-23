import mongoose, { Schema, Document, Model } from "mongoose";

export type VisitorType = "student" | "faculty" | "employee";

export interface IVisitor extends Document {
  name: string;
  email: string;
  rfid?: string;
  program: string;
  type: VisitorType;
  blocked: boolean;
  blockedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rfid: { type: String, sparse: true },
    program: { type: String, required: true },
    type: { type: String, enum: ["student", "faculty", "employee"], required: true },
    blocked: { type: Boolean, default: false },
    blockedReason: { type: String },
  },
  { timestamps: true }
);

VisitorSchema.index({ name: "text", program: "text", email: "text" });

const Visitor: Model<IVisitor> =
  mongoose.models.Visitor || mongoose.model<IVisitor>("Visitor", VisitorSchema);

export default Visitor;
