// create route for payment
import { Router } from "express";
import { finalisePayment, initilisePayment } from "../controllers/paymentControllers/index.js";

const router = Router();

router.post('/initiate-order', initilisePayment);
router.post('/finalize-order', finalisePayment);
export default router;