import { useState } from 'react';

interface WorkbookInputFormProps {
    onSubmit: (workbookId: string, datasourceLuid: string, worksheetName: string) => void;
    isLoading: boolean;
}

export const WorkbookInputForm = ({ onSubmit, isLoading }: WorkbookInputFormProps) => {
    const [workbookId, setWorkbookId] = useState('');
    const [datasourceLuid, setDatasourceLuid] = useState('');
    const [worksheetName, setWorksheetName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (workbookId.trim() && worksheetName.trim()) {
            onSubmit(workbookId.trim(), datasourceLuid.trim(), worksheetName.trim());
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau Data Exporter</h1>
                    <p className="text-gray-600">Enter your workbook details to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="workbookId" className="block text-sm font-semibold text-gray-700 mb-2">
                            Workbook ID (LUID)
                        </label>
                        <input
                            id="workbookId"
                            type="text"
                            value={workbookId}
                            onChange={(e) => setWorkbookId(e.target.value)}
                            placeholder="e.g., abc123de-4567-89fg-hijk-lmnopqrstuvw"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="datasourceLuid" className="block text-sm font-semibold text-gray-700 mb-2">
                            Datasource LUID <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                            id="datasourceLuid"
                            type="text"
                            value={datasourceLuid}
                            onChange={(e) => setDatasourceLuid(e.target.value)}
                            placeholder="Leave empty to auto-detect"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="worksheetName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Worksheet Name
                        </label>
                        <input
                            id="worksheetName"
                            type="text"
                            value={worksheetName}
                            onChange={(e) => setWorksheetName(e.target.value)}
                            placeholder="e.g., Sales by Region"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !workbookId.trim() || !worksheetName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                            </span>
                        ) : (
                            'Fetch Data'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
