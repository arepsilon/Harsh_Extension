# Setup and Run Instructions

## Prerequisites
- Node.js installed (v18+ recommended)
- Tableau Server with Personal Access Token (PAT) credentials

## 1. Backend Setup
The backend handles requests to the Tableau VizQL Data Service.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `pat_config.json` file in the `backend` directory:
   ```json
   {
     "tableau_server": "https://your-tableau-server.com",
     "api_version": "3.20",
     "site_content_url": "",
     "pat_name": "your-pat-token-name",
     "pat_secret": "your-pat-token-secret"
   }
   ```
   
   **Field Explanations:**
   - `tableau_server`: Your Tableau Server URL (e.g., `https://tableau.yourcompany.com`)
   - `api_version`: Tableau REST API version (use `"3.20"` or leave as is)
   - `site_content_url`: Site content URL - leave empty `""` for default site, or use your site's content URL (e.g., `"mysite"`)
   - `pat_name`: Name of your Personal Access Token
   - `pat_secret`: Secret value of your Personal Access Token

   **How to create a PAT:**
   1. Log in to your Tableau Server
   2. Click on your profile → Settings → Personal Access Tokens
   3. Create a new token with appropriate permissions
   4. Copy the token name and secret immediately (you won't be able to see the secret again)

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3001`.

## 2. Frontend Setup
The frontend provides the web interface for data export.

1. Navigate to the root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Note: On Windows Command Prompt, use `copy .env.example .env`*

4. Update `.env` if your backend is running on a different port:
   - `VITE_BACKEND_URL`: Default is `http://localhost:3001/api`

5. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be hosted at `http://localhost:5173`.

## 3. Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter the following information:
   - **Workbook Name**: Name of your workbook on Tableau Server
   - **Datasource LUID** (optional): Leave empty to auto-detect
   - **Worksheet Name**: Name of the worksheet to export
3. Click "Fetch Data"
4. The worksheet configuration will load with rows, columns, and values pre-populated
5. Apply formatting as needed and download the data

## Convenience Script (Windows)
You can use the `start_dev.bat` script in the root directory to start both backend and frontend servers in separate terminal windows:

```bash
start_dev.bat
```
