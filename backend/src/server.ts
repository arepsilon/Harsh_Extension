/**
 * Express Server for Tableau Extension Backend
 * Provides VizQL Data Service API for frontend
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import tableauConfig from './config/tableau.config';
import authService from './services/auth.service';
import dataRoutes from './routes/data.routes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Middleware
// ============================================================================

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'Tableau Extension Backend',
        version: '1.0.0',
        status: 'running'
    });
});

// Data API routes
app.use('/api', dataRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
    try {
        console.log('\n========================================');
        console.log('Tableau Extension Backend');
        console.log('========================================\n');

        // Load Tableau configuration
        console.log('Loading configuration...');
        const config = tableauConfig.loadConfig();
        console.log(`Server URL: ${config.serverUrl}`);
        console.log(`Site ID: ${config.siteId || 'default'}\n`);

        // Authenticate with Tableau Server
        console.log('Authenticating with Tableau Server...');
        await authService.signIn();

        // Start Express server
        app.listen(PORT, () => {
            console.log('\n========================================');
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
            console.log('========================================\n');
            console.log('Available endpoints:');
            console.log('  POST /api/workbook/metadata');
            console.log('  POST /api/datasource/metadata');
            console.log('  POST /api/query/pivot');
            console.log('  POST /api/query/custom');
            console.log('\nReady to accept requests!\n');
        });
    } catch (error: any) {
        console.error('\n❌ Server startup failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await authService.signOut();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await authService.signOut();
    process.exit(0);
});

// Start the server
startServer();

export default app;
