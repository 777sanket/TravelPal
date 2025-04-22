import { Router } from "express";
import {
  createItinerary,
  getItineraries,
  getItineraryById,
  updateItinerary,
  // itineraryCreate,
  deleteItinerary,
} from "../controllers/itinerary.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/", createItinerary);
router.get("/", getItineraries);
router.get("/:id", getItineraryById);
router.put("/:id", updateItinerary);
// router.post("/create", itineraryCreate);
router.delete("/:id", deleteItinerary);

export default router;
