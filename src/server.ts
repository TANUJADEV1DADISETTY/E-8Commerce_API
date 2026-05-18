import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const port = process.env.API_PORT || 8080;

app.use(express.json());

app.use('/', routes);

// Add a default handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
