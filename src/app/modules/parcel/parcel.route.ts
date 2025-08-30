import express from "express";
import {
  createParcel,
  cancelParcel,
  confirmDelivery,
  updateParcelStatus,
  getParcelByTrackingId,
  getMyParcels,
  getIncomingParcels,
  getAllParcels,
  getParcelById,
  deleteParcel,
  toggleParcelStatus,
  getDeliveryStats,
  toggleParcelBlock,
  getReceiverUsers,
} from "./parcel.controller";
import { authenticate, authorize } from "../../middlewares/auth";

const router = express.Router();

// Public routes
router.get("/track/:trackingId", getParcelByTrackingId); // public tracking

// Sender routes
router.post("/", authenticate, authorize("sender"), createParcel);
router.patch("/cancel/:id", authenticate, authorize("sender"), cancelParcel);
router.get("/my-parcels", authenticate, authorize("sender"), getMyParcels);
router.get(
  "/receivers",
  authenticate,
  authorize("sender", "admin"),
  getReceiverUsers
);

// Receiver routes
router.get(
  "/incoming",
  authenticate,
  authorize("receiver"),
  getIncomingParcels
);
router.patch(
  "/confirm/:id",
  authenticate,
  authorize("receiver"),
  confirmDelivery
);

// Admin routes
router.get("/", authenticate, authorize("admin"), getAllParcels);
router.get("/stats", authenticate, authorize("admin"), getDeliveryStats);
router.get("/:id", authenticate, authorize("admin"), getParcelById);
router.patch(
  "/status/:id",
  authenticate,
  authorize("admin"),
  updateParcelStatus
);
router.patch(
  "/toggle/:id",
  authenticate,
  authorize("admin"),
  toggleParcelStatus
);
router.patch(
  "/toggle/block/:parcelId",
  authenticate,
  authorize("admin"),
  toggleParcelBlock
);
router.delete("/:id", authenticate, authorize("admin"), deleteParcel);

export default router;
