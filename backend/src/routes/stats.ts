import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { statsService } from '../services/stats';

const router = Router();

router.get('/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dashboard = await statsService.getDashboard(req.userId!);
    res.json(dashboard);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
