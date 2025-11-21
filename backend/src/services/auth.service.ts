/**
 * Tableau Authentication Service
 * Handles PAT (Personal Access Token) authentication with Tableau Server
 */

import axios, { AxiosInstance } from 'axios';
import tableauConfig from '../config/tableau.config';
import { AuthToken } from '../types/vizql.types';

export class AuthService {
    private static instance: AuthService;
    private authToken: AuthToken | null = null;
    private axiosInstance: AxiosInstance;

    private constructor() {
        this.axiosInstance = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Sign in to Tableau Server using PAT
     */
    public async signIn(): Promise<AuthToken> {
        const config = tableauConfig.getConfig();
        const serverUrl = config.tableau_server;
        const apiVersion = config.api_version || '3.20';

        try {
            const signInUrl = `${serverUrl}/api/${apiVersion}/auth/signin`;

            const requestBody = {
                credentials: {
                    personalAccessTokenName: config.pat_name,
                    personalAccessTokenSecret: config.pat_secret,
                    site: {
                        contentUrl: config.site_content_url
                    }
                }
            };

            console.log(`Authenticating with Tableau Server: ${serverUrl}`);

            const response = await this.axiosInstance.post(signInUrl, requestBody);

            const credentials = response.data.credentials;

            this.authToken = {
                token: credentials.token,
                siteId: credentials.site.id,
                userId: credentials.user.id
            };

            console.log('✓ Authentication successful');
            return this.authToken;
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.summary || error.message;
            console.error('Authentication failed:', errorMessage);
            throw new Error(`Tableau authentication failed: ${errorMessage}`);
        }
    }

    /**
     * Get current auth token (signs in if needed)
     */
    public async getAuthToken(): Promise<string> {
        if (!this.authToken) {
            await this.signIn();
        }
        return this.authToken!.token;
    }

    /**
     * Get authenticated site ID
     */
    public async getSiteId(): Promise<string> {
        if (!this.authToken) {
            await this.signIn();
        }
        return this.authToken!.siteId;
    }

    /**
     * Get authenticated axios instance for VizQL requests
     */
    public async getAuthenticatedClient(): Promise<AxiosInstance> {
        const token = await this.getAuthToken();
        const vizqlBaseUrl = tableauConfig.getVizQLBaseUrl();

        return axios.create({
            baseURL: vizqlBaseUrl,
            timeout: 60000,
            headers: {
                'X-Tableau-Auth': token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Sign out from Tableau Server
     */
    public async signOut(): Promise<void> {
        if (!this.authToken) {
            return;
        }

        try {
            const config = tableauConfig.getConfig();
            const apiVersion = config.api_version || '3.20';
            const signOutUrl = `${config.tableau_server}/api/${apiVersion}/auth/signout`;

            await this.axiosInstance.post(
                signOutUrl,
                {},
                {
                    headers: {
                        'X-Tableau-Auth': this.authToken.token
                    }
                }
            );

            this.authToken = null;
            console.log('✓ Signed out from Tableau Server');
        } catch (error: any) {
            console.error('Sign out failed:', error.message);
        }
    }

    /**
     * Refresh authentication token
     */
    public async refreshToken(): Promise<AuthToken> {
        await this.signOut();
        return await this.signIn();
    }
}

export default AuthService.getInstance();
