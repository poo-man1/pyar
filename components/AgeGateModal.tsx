import React from 'react';

interface AgeGateModalProps {
  onVerify: () => void;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({ onVerify }) => {

  const handleUnder18 = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-700">
        <h1 className="text-4xl font-bold text-orange-400 mb-2">Pyar</h1>
        <p className="text-lg text-gray-300 mb-6">Connect. Chat. Discover.</p>
        
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Age Verification</h2>
          <p className="text-gray-400 mb-6">
            You must be at least 18 years old to enter. By clicking 'Verify & Enter', you confirm your age and agree to our{' '}
            <a href="#" className="text-orange-400 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-orange-400 hover:underline">Community Guidelines</a>.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={onVerify}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300"
            >
              I Am 18+ / Verify & Enter
            </button>
            <button
              onClick={handleUnder18}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              I Am Under 18
            </button>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
            <a href="#" className="hover:underline">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
};
