import { Router } from "express";
import {
  createItinerary,
  getItineraries,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
  updateItineraryWithTags,
} from "../controllers/itinerary.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/", createItinerary);
router.get("/", getItineraries);
router.get("/:id", getItineraryById);
router.put("/:id", updateItinerary);
router.delete("/:id", deleteItinerary);
router.post("/:id/tags", updateItineraryWithTags);

export default router;
