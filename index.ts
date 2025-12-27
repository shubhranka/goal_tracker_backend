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

startServer().then(() => {
  // Create a interval
  const interval = setInterval(() => {
    fetch('https://goal-tracker-backend-uh3k.onrender.com/api/goals/health')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
      })
      .catch(error => {
        console.error('Server health check failed at', new Date().toISOString(), ':', error);
      });
  }, 14 * 60 * 1000); // 14 minutes
  
  // Clean up on exit
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('Server shutting down...');
    process.exit(0);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
