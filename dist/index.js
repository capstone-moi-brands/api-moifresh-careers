import express from 'express';
import authRoutes from './routes/auth.routes';
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
    res.send('Welcome to Job Portal MOI Brands API');
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
