import { Router } from "express";
import { home } from "../controllers/admin.controller";

const router = Router();

router.get("/", home);

export default router;