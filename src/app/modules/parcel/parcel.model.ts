import { Schema, model, Types } from "mongoose";

export enum ParcelStatus {
  REQUESTED = "requested",
  APPROVED = "approved",
  DISPATCHED = "dispatched",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELED = "canceled",
}

export interface IStatusLog {
  status: ParcelStatus;
  timestamp: Date;
  updatedBy: Types.ObjectId; // user who updated
  note?: string;
  location?: string;
}

export interface IParcel {
  trackingId: string;
  type: string;
  weight: number;
  fee?: number;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  fromAddress: string;
  toAddress: string;
  currentStatus: ParcelStatus;
  statusLogs: IStatusLog[];
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  isBlocked?: boolean
}

const StatusLogSchema = new Schema<IStatusLog>({
  status: { type: String, enum: Object.values(ParcelStatus), required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  note: String,
  location: String,
});

const ParcelSchema = new Schema<IParcel>(
  {
    trackingId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    weight: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: {
      name:String,
      phone:String,
    },
    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    currentStatus: { type: String, enum: Object.values(ParcelStatus), default: ParcelStatus.REQUESTED },
    statusLogs: { type: [StatusLogSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    isBlocked: {type: Boolean, default: false}
  },
  { timestamps: true }
);

export const Parcel = model<IParcel>("Parcel", ParcelSchema);
