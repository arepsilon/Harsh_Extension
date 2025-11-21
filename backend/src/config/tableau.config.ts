/**
 * Tableau Server Configuration
 * Loads PAT (Personal Access Token) configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import { TableauPATConfig } from '../types/vizql.types';

export class TableauConfig {
    private static instance: TableauConfig;
    private config: TableauPATConfig | null = null;

    private constructor() {}

    public static getInstance(): TableauConfig {
        if (!TableauConfig.instance) {
            TableauConfig.instance = new TableauConfig();
        }
        return TableauConfig.instance;
    }

    /**
     * Load PAT configuration from pat_config.json
     */
    public loadConfig(configPath?: string): TableauPATConfig {
        if (this.config) {
            return this.config;
        }

        const defaultPath = path.join(process.cwd(), 'pat_config.json');
        const filePath = configPath || defaultPath;

        try {
            const configData = fs.readFileSync(filePath, 'utf-8');
            this.config = JSON.parse(configData);

            // Validate required fields
            if (!this.config?.serverUrl || !this.config?.tokenName || !this.config?.tokenValue) {
                throw new Error('Invalid PAT configuration: missing required fields (serverUrl, tokenName, tokenValue)');
            }

            console.log(`✓ Loaded PAT configuration from ${filePath}`);
            return this.config;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error(
                    `PAT configuration file not found at ${filePath}. ` +
                    `Please create pat_config.json with serverUrl, tokenName, and tokenValue.`
                );
            }
            throw error;
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): TableauPATConfig {
        if (!this.config) {
            return this.loadConfig();
        }
        return this.config;
    }

    /**
     * Get server URL
     */
    public getServerUrl(): string {
        return this.getConfig().serverUrl;
    }

    /**
     * Get VizQL Data Service base URL
     */
    public getVizQLBaseUrl(): string {
        const serverUrl = this.getServerUrl();
        return `${serverUrl}/vizql-data-service/v1`;
    }
}

export default TableauConfig.getInstance();
