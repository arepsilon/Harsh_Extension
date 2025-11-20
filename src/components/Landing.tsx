import { Settings } from 'lucide-react';

interface LandingProps {
    onConfigure: () => void;
}

export const Landing = ({ onConfigure }: LandingProps) => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Tableau Extension</h1>
        <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium text-lg mb-4"
            onClick={() => alert('Export functionality coming soon!')}
        >
            Export to Excel
        </button>
        <button
            onClick={onConfigure}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
            <Settings size={16} className="mr-2" />
            Configure
        </button>
    </div>
);
