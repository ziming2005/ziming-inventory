import React from "react";
import "../styles/LoadingOverlay.css"; // optional for styling

type LoadingOverlayProps = {
  isLoading: boolean;
  message?: string;
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message }) => {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner" />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

export default LoadingOverlay;
