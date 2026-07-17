import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import adminRouter from "./admin";
import blogRouter from "./blog";
import newsletterRouter from "./newsletter";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(adminRouter);
router.use(blogRouter);
router.use(newsletterRouter);

export default router;
