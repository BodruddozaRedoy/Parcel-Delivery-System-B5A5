import { Request, Response } from "express";
import { Parcel, ParcelStatus } from "./parcel.model";
import { generateTrackingId } from "../../utils/generateTrackingId";
import { User } from "../user/user.model"; // Added import for User
import { success } from "zod";

// Helper: generate tracking ID

// Sender: create parcel
export const createParcel = async (req: Request, res: Response) => {
  try {
    const { type, weight, fee, receiver, fromAddress, toAddress } = req.body;

    // Input validation
    if (!type || !weight || !receiver || !fromAddress || !toAddress) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    if (weight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Weight must be greater than 0",
      });
    }

    if (fee && fee < 0) {
      return res.status(400).json({
        success: false,
        message: "Fee cannot be negative",
      });
    }

    // Validate receiver exists
    // const receiverUser = await User.findById(receiver);
    // if (!receiverUser) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Receiver not found",
    //   });
    // }

    const trackingId = generateTrackingId();
    const parcel = new Parcel({
      trackingId,
      type,
      weight,
      fee: fee || 0,
      sender: req.user!._id,
      receiver,
      fromAddress,
      toAddress,
      statusLogs: [
        {
          status: ParcelStatus.REQUESTED,
          updatedBy: req.user!._id,
          timestamp: new Date(),
          note: "Parcel created by sender",
        },
      ],
    });

    await parcel.save();

    // Populate sender and receiver details
    await parcel.populate("sender", "fullName email phone");
    await parcel.populate("receiver", "fullName email phone");

    res.status(201).json({
      success: true,
      message: "Parcel created successfully",
      data: parcel,
    });
  } catch (error) {
    console.error("Create parcel error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating parcel",
    });
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
    if (!parcel)
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });
    if (parcel.currentStatus === "canceled") {
      return res
        .status(404)
        .json({ success: false, message: "Parcel is already canceled" });
    }
    parcel.currentStatus = status;
    parcel.statusLogs.push({
      status,
      updatedBy: req.user!._id,
      note,
      location,
      timestamp: new Date(),
    });
    await parcel.save();

    res
      .status(200)
      .json({ success: true, message: "Parcel status updated", parcel });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get parcel by tracking ID
export const getParcelByTrackingId = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findOne({ trackingId: req.params.trackingId });
    if (!parcel)
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });

    res.status(200).json({
      success: true,
      message: "Fetched parcel by tracking id",
      parcel,
    });
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

// Admin: Get all parcels with filters
export const getAllParcels = async (req: Request, res: Response) => {
  try {
    const { status, sender, receiver, page = 1, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.currentStatus = status;
    if (sender) filter.sender = sender;
    if (receiver) filter.receiver = receiver;

    const skip = (Number(page) - 1) * Number(limit);

    const parcels = await Parcel.find(filter)
      .populate("sender", "fullName email phone")
      .populate("receiver", "fullName email phone")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Parcel.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "All parcels fetched",
      data: parcels,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: Get parcel by ID
export const getParcelById = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findById(req.params.id)
      .populate("sender", "fullName email phone")
      .populate("receiver", "fullName email phone");

    if (!parcel)
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });

    res.status(200).json({
      success: true,
      message: "Parcel fetched",
      data: parcel,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: Delete parcel (soft delete)
export const deleteParcel = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel)
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });

    // Soft delete
    parcel.isDeleted = true;
    await parcel.save();

    res.status(200).json({
      success: true,
      message: "Parcel deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: Block/Unblock parcel
export const toggleParcelStatus = async (req: Request, res: Response) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel)
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });

    // Toggle between active and blocked status
    if (parcel.currentStatus === ParcelStatus.REQUESTED) {
      parcel.currentStatus = ParcelStatus.APPROVED;
    } else if (parcel.currentStatus === ParcelStatus.APPROVED) {
      parcel.currentStatus = ParcelStatus.DISPATCHED;
    } else if (parcel.currentStatus === ParcelStatus.DISPATCHED) {
      parcel.currentStatus = ParcelStatus.IN_TRANSIT;
    }

    parcel.statusLogs.push({
      status: parcel.currentStatus,
      updatedBy: req.user!._id,
      timestamp: new Date(),
      note: `Status updated to ${parcel.currentStatus} by admin`,
    });

    await parcel.save();

    res.status(200).json({
      success: true,
      message: `Parcel status updated to ${parcel.currentStatus}`,
      data: parcel,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get delivery statistics (Admin)
export const getDeliveryStats = async (req: Request, res: Response) => {
  try {
    const totalParcels = await Parcel.countDocuments();
    const deliveredParcels = await Parcel.countDocuments({
      currentStatus: ParcelStatus.DELIVERED,
    });
    const inTransitParcels = await Parcel.countDocuments({
      currentStatus: ParcelStatus.IN_TRANSIT,
    });
    const pendingParcels = await Parcel.countDocuments({
      currentStatus: {
        $in: [
          ParcelStatus.REQUESTED,
          ParcelStatus.APPROVED,
          ParcelStatus.DISPATCHED,
        ],
      },
    });

    res.status(200).json({
      success: true,
      message: "Delivery statistics fetched",
      data: {
        total: totalParcels,
        delivered: deliveredParcels,
        inTransit: inTransitParcels,
        pending: pendingParcels,
        deliveryRate:
          totalParcels > 0
            ? ((deliveredParcels / totalParcels) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const toggleParcelBlock = async (req: Request, res: Response) => {
  const { parcelId } = req.params;
  try {
    // Find parcel first
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return res
        .status(404)
        .json({ success: false, message: "Parcel not found" });
    }

    // Toggle the value
    parcel.isBlocked = !parcel.isBlocked;
    await parcel.save();

    res.status(200).json({
      success: true,
      message: `Parcel ${parcel.isBlocked ? "blocked" : "unblocked"}`,
      data: parcel,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
