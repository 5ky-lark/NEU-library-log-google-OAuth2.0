import mongoose, { Schema, Document, Model } from "mongoose";
import { VISIT_REASONS, type VisitReason } from "@/lib/constants";

export { VISIT_REASONS };
export type { VisitReason };

export interface IVisitLog extends Document {
  visitor: mongoose.Types.ObjectId;
  reason: VisitReason;
  checkInTime: Date;
  checkOutTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VisitLogSchema = new Schema<IVisitLog>(
  {
    visitor: { type: Schema.Types.ObjectId, ref: "Visitor", required: true },
    reason: { type: String, enum: VISIT_REASONS, required: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date },
  },
  { timestamps: true }
);

VisitLogSchema.index({ visitor: 1 });
VisitLogSchema.index({ checkInTime: 1 });
VisitLogSchema.index({ reason: 1 });
VisitLogSchema.index({ checkInTime: -1, reason: 1 });
VisitLogSchema.index({ checkOutTime: 1 });

const VisitLog: Model<IVisitLog> =
  mongoose.models.VisitLog ||
  mongoose.model<IVisitLog>("VisitLog", VisitLogSchema);

export default VisitLog;
