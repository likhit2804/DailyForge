import React from 'react';

const EmptyState = ({ icon = '📭', title = 'Nothing here', subtitle = '', actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-illustration">{icon}</div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-subtext">{subtitle}</div>}
      {actionLabel && (
        <button className="empty-action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
};

export default EmptyState;
