import express from "express";
import {
  createParcel,
  cancelParcel,
  confirmDelivery,
  updateParcelStatus,
  getParcelByTrackingId,
  getMyParcels,
  getIncomingParcels,
} from "./parcel.controller";
import { authenticate, authorize } from "../../middlewares/auth";

const router = express.Router();

// Sender routes
router.post("/", authenticate, authorize("sender"), createParcel);
router.patch("/cancel/:id", authenticate, authorize("sender"), cancelParcel);
router.get("/my-parcels", authenticate, authorize("sender"), getMyParcels);

// Receiver routes
router.get("/incoming", authenticate, authorize("receiver"), getIncomingParcels);
router.patch("/confirm/:id", authenticate, authorize("receiver"), confirmDelivery);

// Admin routes
router.patch("/status/:id", authenticate, authorize("admin"), updateParcelStatus);

// Public routes
router.get("/track/:trackingId", getParcelByTrackingId); // public tracking

export default router;
