import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import coursRouter from "./cours.js";
import reservationsRouter from "./reservations.js";
import abonnementsRouter from "./abonnements.js";
import coachsRouter from "./coachs.js";
import messagesRouter from "./messages.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/cours", coursRouter);
router.use("/reservations", reservationsRouter);
router.use("/abonnements", abonnementsRouter);
router.use("/coachs", coachsRouter);
router.use("/messages", messagesRouter);
router.use("/admin", adminRouter);

export default router;
