import { Router } from "express";
import { homeCustomer, getAllItems, buy } from "../controllers/customer.controller";

const router = Router();

router.get("/", homeCustomer);

router.get('/available-products', getAllItems);

router.post('/buy', buy);

export default router;