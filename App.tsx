import React, { useState, useCallback } from 'react';
import { AgeGateModal } from './components/AgeGateModal';
import { VideoChat } from './components/VideoChat';

export const App: React.FC = () => {
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleVerify = useCallback(() => {
    setIsVerified(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {!isVerified ? (
        <AgeGateModal onVerify={handleVerify} />
      ) : (
        <VideoChat />
      )}
    </div>
  );
};
