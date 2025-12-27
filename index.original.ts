import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { initializeDatabase } from './database/connection';
import goalRoutes from './routes/goal';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Serve frontend static files
    app.use(express.static(path.join(__dirname, '../../dist')));

    app.use('/api/goals', goalRoutes);

    // For any other request, serve the frontend's index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
