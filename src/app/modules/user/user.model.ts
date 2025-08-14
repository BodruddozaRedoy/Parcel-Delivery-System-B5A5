import mongoose, { Schema } from "mongoose";
import { IUser, Role, Status } from "../../interfaces/user.interface";



const UserSchema: Schema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), default: Role.SENDER },
    status: { type: String, enum: Object.values(Status), default: Status.ACTIVE },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    avatar: { type: String },
    parcels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parcel" }],
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
