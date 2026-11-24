import express, { Request, Response } from 'express';
import path from 'path';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import screeningRoutes from './routes/screening.routes';
import { setupSwagger } from './docs/swagger';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

setupSwagger(app);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/screenings', screeningRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to Job Portal MOI Brands API',
        documentation: '/api-docs',
        openapi_spec: '/api-docs.json',
    });
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
    console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
