import React, { useState } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const reportReasons = [
  "Nudity / Lewd Acts",
  "Harassment",
  "Underage User",
  "Spam / Bots",
  "Hate Speech",
  "Other"
];

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedReason) return;
    // Here you would typically send the report to a backend server.
    console.log(`Report submitted for reason: ${selectedReason}`);
    setIsSubmitted(true);
    setTimeout(() => {
        handleClose();
    }, 2000); // Close modal after 2 seconds
  };
  
  const handleClose = () => {
    setIsSubmitted(false);
    setSelectedReason('');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm w-full border border-gray-700" onClick={e => e.stopPropagation()}>
        {isSubmitted ? (
            <div className="text-center p-4">
                <h3 className="text-xl font-semibold text-green-400 mb-2">Report Submitted</h3>
                <p className="text-gray-300">Thank you for helping keep Pyar safe.</p>
            </div>
        ) : (
            <>
                <h2 className="text-2xl font-bold text-white mb-4">Report User</h2>
                <p className="text-gray-400 mb-6">Select a reason for reporting this user. Your report is anonymous.</p>
                <div className="space-y-3">
                    {reportReasons.map(reason => (
                        <button
                            key={reason}
                            onClick={() => setSelectedReason(reason)}
                            className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${selectedReason === reason ? 'bg-orange-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                        >
                            {reason}
                        </button>
                    ))}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-gray-200 font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedReason}
                        className="px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Submit Report
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
