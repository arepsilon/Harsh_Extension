/**
 * Workbook Service
 * Handles downloading Tableau workbooks from server
 */

import axios from 'axios';
import * as JSZip from 'jszip';
import authService from './auth.service';
import tableauConfig from '../config/tableau.config';

export class WorkbookService {
    private static instance: WorkbookService;

    private constructor() {}

    public static getInstance(): WorkbookService {
        if (!WorkbookService.instance) {
            WorkbookService.instance = new WorkbookService();
        }
        return WorkbookService.instance;
    }

    /**
     * Download workbook from Tableau Server
     * @param workbookId - The ID or LUID of the workbook
     * @returns Buffer containing the .twb or .twbx file
     */
    public async downloadWorkbook(workbookId: string): Promise<Buffer> {
        try {
            const token = await authService.getAuthToken();
            const config = tableauConfig.getConfig();
            const serverUrl = config.serverUrl;

            // Get site ID from auth service
            await authService.signIn(); // Ensure we're signed in
            const authToken = await authService.getAuthToken();

            // Download workbook using REST API
            const downloadUrl = `${serverUrl}/api/3.20/sites/${config.siteId || 'default'}/workbooks/${workbookId}/content`;

            console.log(`Downloading workbook: ${workbookId}`);

            const response = await axios.get(downloadUrl, {
                headers: {
                    'X-Tableau-Auth': authToken
                },
                responseType: 'arraybuffer',
                timeout: 60000
            });

            console.log(`✓ Workbook downloaded (${response.data.byteLength} bytes)`);

            return Buffer.from(response.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.toString() || error.message;
            console.error('Workbook download failed:', errorMessage);
            throw new Error(`Failed to download workbook: ${errorMessage}`);
        }
    }

    /**
     * Extract TWB XML from TWBX file
     * @param workbookBuffer - Buffer containing .twbx file
     * @returns XML content as string
     */
    public async extractXMLFromTWBX(workbookBuffer: Buffer): Promise<string> {
        try {
            console.log('Extracting XML from TWBX...');

            const zip = await JSZip.loadAsync(workbookBuffer);

            // Find the .twb file inside the TWBX
            const twbFiles = Object.keys(zip.files).filter(name => name.endsWith('.twb'));

            if (twbFiles.length === 0) {
                throw new Error('No .twb file found in TWBX archive');
            }

            const twbFileName = twbFiles[0];
            console.log(`Found TWB file: ${twbFileName}`);

            const xmlContent = await zip.file(twbFileName)!.async('string');

            console.log(`✓ XML extracted (${xmlContent.length} characters)`);

            return xmlContent;
        } catch (error: any) {
            console.error('XML extraction failed:', error.message);
            throw new Error(`Failed to extract XML from workbook: ${error.message}`);
        }
    }

    /**
     * Download and extract workbook XML in one step
     * @param workbookId - The ID or LUID of the workbook
     * @returns XML content as string
     */
    public async downloadAndExtract(workbookId: string): Promise<string> {
        const workbookBuffer = await this.downloadWorkbook(workbookId);
        return await this.extractXMLFromTWBX(workbookBuffer);
    }
}

export default WorkbookService.getInstance();
