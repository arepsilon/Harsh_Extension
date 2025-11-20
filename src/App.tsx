import { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { ConfigPanel } from './components/ConfigPanel';
import { useTableau } from './hooks/useTableau';

function App() {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const {
    worksheets,
    selectedWorksheet,
    setSelectedWorksheet,
    summaryData,
    fetchSummaryData,
    isLoading
  } = useTableau();

  // Auto-fetch data when worksheet is selected
  useEffect(() => {
    if (selectedWorksheet) {
      fetchSummaryData(selectedWorksheet);
    }
  }, [selectedWorksheet]);

  return (
    <div className="h-screen w-screen overflow-hidden font-sans text-gray-900">
      {isConfiguring ? (
        <ConfigPanel
          onClose={() => setIsConfiguring(false)}
          worksheets={worksheets}
          selectedWorksheet={selectedWorksheet}
          onSelectWorksheet={setSelectedWorksheet}
          summaryData={summaryData}
          isLoading={isLoading}
        />
      ) : (
        <Landing onConfigure={() => setIsConfiguring(true)} />
      )}
    </div>
  );
}

export default App;
