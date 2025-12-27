import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createConnection } from './connection';
import { Goal } from '../types';

export class GoalService {
  private connection: any;

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    this.connection = await createConnection();
  }

  async getAllGoals(): Promise<Goal[]> {
    try {
      const [rows] = await this.connection.execute('SELECT * FROM goals ORDER BY created_at');
      return (rows as RowDataPacket[]).map(this.mapRowToGoal);
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }

  async getGoalById(id: string): Promise<Goal | null> {
    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM goals WHERE id = ?',
        [id]
      );
      const goals = (rows as RowDataPacket[]).map(this.mapRowToGoal);
      return goals.length > 0 ? goals[0] : null;
    } catch (error) {
      console.error('Error fetching goal:', error);
      throw error;
    }
  }

  async createGoal(goal: Omit<Goal, 'id'>): Promise<Goal> {
    try {
      const id = require('uuid').v4();
      const now = Date.now();
      
      await this.connection.execute(
        `INSERT INTO goals (
          id, title, description, parent_id, progress, is_completed, 
          created_at, completed_at, scheduled_days, one_time_task, 
          expanded, reminder
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          goal.title,
          goal.description || null,
          goal.parentId || null,
          goal.progress || 0,
          goal.isCompleted || false,
          goal.createdAt || now,
          goal.completedAt || null,
          goal.scheduledDays ? JSON.stringify(goal.scheduledDays) : null,
          goal.oneTimeTask || null,
          goal.expanded || false,
          goal.reminder || null
        ]
      );

      return {
        id,
        ...goal,
        createdAt: goal.createdAt || now
      };
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const existingGoal = await this.getGoalById(id);
      if (!existingGoal) {
        throw new Error('Goal not found');
      }

      const updatedGoal = { ...existingGoal, ...updates };
      
      await this.connection.execute(
        `UPDATE goals SET 
          title = ?, description = ?, parent_id = ?, progress = ?, 
          is_completed = ?, completed_at = ?, scheduled_days = ?, 
          one_time_task = ?, expanded = ?, reminder = ?
        WHERE id = ?`,
        [
          updatedGoal.title,
          updatedGoal.description || null,
          updatedGoal.parentId || null,
          updatedGoal.progress,
          updatedGoal.isCompleted,
          updatedGoal.completedAt || null,
          updatedGoal.scheduledDays ? JSON.stringify(updatedGoal.scheduledDays) : null,
          updatedGoal.oneTimeTask || null,
          updatedGoal.expanded || false,
          updatedGoal.reminder || null,
          id
        ]
      );

      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  async deleteGoal(id: string): Promise<void> {
    try {
      const [result] = await this.connection.execute(
        'DELETE FROM goals WHERE id = ?',
        [id]
      );
      
      if ((result as ResultSetHeader).affectedRows === 0) {
        throw new Error('Goal not found');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  async reorderGoals(goals: Goal[]): Promise<void> {
    try {
      // This is a simplified approach - in a real app you might want an order column
      // For now, we'll just update the goals individually
      for (const goal of goals) {
        await this.updateGoal(goal.id, goal);
      }
    } catch (error) {
      console.error('Error reordering goals:', error);
      throw error;
    }
  }

  async getProgressData() {
    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM progress_snapshots ORDER BY timestamp DESC LIMIT 100'
      );
      return rows as RowDataPacket[];
    } catch (error) {
      console.error('Error fetching progress data:', error);
      throw error;
    }
  }

  async saveProgressSnapshot(snapshot: {
    timestamp: number;
    progress: number;
    total: number;
    completed: number;
  }) {
    try {
      await this.connection.execute(
        'INSERT INTO progress_snapshots (timestamp, progress, total_goals, completed_goals) VALUES (?, ?, ?, ?)',
        [snapshot.timestamp, snapshot.progress, snapshot.total, snapshot.completed]
      );
    } catch (error) {
      console.error('Error saving progress snapshot:', error);
      throw error;
    }
  }

  private mapRowToGoal(row: RowDataPacket): Goal {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      parentId: row.parent_id,
      progress: row.progress,
      isCompleted: Boolean(row.is_completed),
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
      scheduledDays: row.scheduled_days ? JSON.parse(row.scheduled_days) : undefined,
      oneTimeTask: row.one_time_task || undefined,
      expanded: Boolean(row.expanded),
      reminder: row.reminder || undefined
    };
  }
}

export default GoalService;
