import express, { Request, Response } from 'express';
import path from 'path';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import screeningRoutes from './routes/screening.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/screenings', screeningRoutes);

app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Job Portal MOI Brands API');
});

app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
    if (err.name === 'MulterError') {
        res.status(400).json({ message: `Upload error: ${err.message}` });
        return;
    }
    res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
