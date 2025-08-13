import { Request, Response } from "express";
import { Parcel, ParcelStatus } from "./parcel.model";
import { Types } from "mongoose";
import { generateTrackingId } from "../../utils/generateTrackingId";

// Helper: generate tracking ID

// Sender: create parcel
export const createParcel = async (req: Request, res: Response) => {
  try {
    const { type, weight, fee, receiver, fromAddress, toAddress } = req.body;

    const trackingId = generateTrackingId();
    const parcel = new Parcel({
      trackingId,
      type,
      weight,
      fee,
      sender: req.user!._id,
      receiver,
      fromAddress,
      toAddress,
      statusLogs: [
        { status: ParcelStatus.REQUESTED, updatedBy: req.user!._id },
      ],
    });

    await parcel.save();
    res.status(201).json({ success: true, message: "Parcel created", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Sender: cancel parcel (if not dispatched)
export const cancelParcel = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: "Parcel not found" });
    if (!parcel.sender.equals(req.user!._id))
      return res.status(403).json({ message: "Not allowed" });

    if (
      [
        ParcelStatus.DISPATCHED,
        ParcelStatus.IN_TRANSIT,
        ParcelStatus.DELIVERED,
      ].includes(parcel.currentStatus)
    )
      return res
        .status(400)
        .json({ message: "Cannot cancel dispatched or delivered parcel" });

    parcel.currentStatus = ParcelStatus.CANCELED;
    parcel.statusLogs.push({
      status: ParcelStatus.CANCELED,
      updatedBy: req.user!._id,
      timestamp: new Date(),
    });

    await parcel.save();

    res.status(200).json({ message: "Parcel canceled", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Receiver: confirm delivery
export const confirmDelivery = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: "Parcel not found" });
    if (!parcel.receiver.equals(req.user!._id))
      return res.status(403).json({ message: "Not allowed" });

    if (parcel.currentStatus !== ParcelStatus.IN_TRANSIT)
      return res.status(400).json({ message: "Parcel not in transit" });

    parcel.currentStatus = ParcelStatus.DELIVERED;
    parcel.statusLogs.push({
      status: ParcelStatus.DELIVERED,
      updatedBy: req.user!._id,
      timestamp: new Date(), // required field
    });

    await parcel.save();

    res
      .status(200)
      .json({ success: true, message: "Parcel delivered", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: update parcel status
export const updateParcelStatus = async (req: Request, res: Response) => {
  const { status, note, location } = req.body;
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({success: false, message: "Parcel not found" });

    parcel.currentStatus = status;
    parcel.statusLogs.push({
      status,
      updatedBy: req.user!._id,
      note,
      location,
      timestamp: new Date(),
    });
    await parcel.save();

    res.status(200).json({success: true, message: "Parcel status updated", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get parcel by tracking ID
export const getParcelByTrackingId = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findOne({ trackingId: req.params.trackingId });
    if (!parcel) return res.status(404).json({success: false, message: "Parcel not found" });

    res.status(200).json({success: true, message: "Fetched parcel by tracking id", parcel});
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Sender: get all own parcels
export const getMyParcels = async (req: Request, res: Response) => {
  try {
    const parcels = await Parcel.find({ sender: req.user!._id });
    res
      .status(200)
      .json({ success: true, message: "Parcel fetched", data: parcels });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Receiver: get all incoming parcels
export const getIncomingParcels = async (req: Request, res: Response) => {
  try {
    const parcels = await Parcel.find({ receiver: req.user!._id });
    res.status(200).json({
      success: true,
      message: "All incoming parcels fetched",
      data: parcels,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
