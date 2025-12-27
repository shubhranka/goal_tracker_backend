import { Router } from 'express';
import { Goal } from '../types';
import GoalService from '../database/goalService.mysql';

const router = Router();
const goalService = new GoalService();

router.get('/health', (_req, res) => {
  res.json({ status: 'OK', service: 'goals-api' });
});


router.get('/', async (_req, res) => {
  try {
    const goals = await goalService.getAllGoals();
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newGoal = await goalService.createGoal(req.body);
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGoal = await goalService.updateGoal(id, req.body);
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.post('/reorder', async (req, res) => {
  try {
    const reorderedGoals = req.body;
    await goalService.reorderGoals(reorderedGoals);
    res.status(200).json(reorderedGoals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder goals' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await goalService.deleteGoal(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

router.get('/progress', async (_req, res) => {
  try {
    const goals = await goalService.getAllGoals();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const completedGoals = goals.filter(g => g.isCompleted && g.completedAt);

    // Weekly
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - i));
      const dayStart = day.getTime();
      const dayEnd = new Date(day).setHours(23, 59, 59, 999);

      const goalsCompleted = completedGoals.filter(g => g.completedAt! >= dayStart && g.completedAt! <= dayEnd);
      return {
        day: day.getDate(),
        progress: goalsCompleted.length, 
        goalIds: goalsCompleted.map(g => g.id),
      };
    });

    // Monthly
    const monthlyData = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (29 - i));
      const dayStart = day.getTime();
      const dayEnd = new Date(day).setHours(23, 59, 59, 999);

      const goalsCompleted = completedGoals.filter(g => g.completedAt! >= dayStart && g.completedAt! <= dayEnd);
      return {
        day: day.getDate(),
        progress: goalsCompleted.length,
        goalIds: goalsCompleted.map(g => g.id),
      };
    });
    
    // Yearly
    const yearlyData = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(today.getFullYear(), i, 1).getTime();
      const monthEnd = new Date(today.getFullYear(), i + 1, 0, 23, 59, 59, 999).getTime();

      const goalsCompleted = completedGoals.filter(g => g.completedAt! >= monthStart && g.completedAt! <= monthEnd);
      return {
        month: i + 1,
        progress: goalsCompleted.length,
        goalIds: goalsCompleted.map(g => g.id),
      };
    });

    res.json({ weekly: weeklyData, monthly: monthlyData, yearly: yearlyData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

export default router;
