import mongoose from "mongoose";

export enum Role {
  ADMIN = "admin",
  SENDER = "sender",
  RECEIVER = "receiver",
}

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
  BANNED = "banned",
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  status: Status;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  avatar?: string;
  parcels?: mongoose.Types.ObjectId[]; // reference to Parcel model
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
}