import { useState } from 'react';
import { WorkbookInputForm } from './components/WorkbookInputForm';
import { ConfigPanel } from './components/ConfigPanel';
import { useTableau } from './hooks/useTableau';

function App() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [workbookId, setWorkbookId] = useState('');
  const [worksheetName, setWorksheetName] = useState('');

  const {
    summaryData,
    worksheetConfig,
    datasourceLuid,
    fetchWorksheetData,
    isLoading,
    error
  } = useTableau();

  const handleWorkbookSubmit = async (wbId: string, dsLuid: string, ws: string) => {
    try {
      setWorkbookId(wbId);
      setWorksheetName(ws);
      await fetchWorksheetData(wbId, dsLuid, ws);
      setIsConfiguring(true);
    } catch (error) {
      console.error('Failed to fetch worksheet data:', error);
      // Error is already displayed via the error state
    }
  };

  if (error && !isConfiguring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden font-sans text-gray-900">
      {isConfiguring && worksheetConfig && summaryData ? (
        <ConfigPanel
          onClose={() => setIsConfiguring(false)}
          worksheetConfig={worksheetConfig}
          summaryData={summaryData}
          datasourceLuid={datasourceLuid}
          workbookId={workbookId}
          worksheetName={worksheetName}
          isLoading={isLoading}
        />
      ) : (
        <WorkbookInputForm
          onSubmit={handleWorkbookSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default App;
