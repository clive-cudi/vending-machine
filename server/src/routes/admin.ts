import { Router } from "express";
import { home, backup } from "../controllers/admin.controller";

const router = Router();

// add auth middleware to admin routes

router.get("/", home);

router.get("/backup", backup);

export default router;