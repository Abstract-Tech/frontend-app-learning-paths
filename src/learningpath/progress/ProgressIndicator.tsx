import React from 'react';
import { Icon } from '@openedx/paragon';
import { CheckCircle, Timelapse, LmsCompletionSolid } from '@openedx/paragon/icons';
import { ProgressStatus, StatusConfig } from './types';

interface ProgressIndicatorProps {
  status: ProgressStatus;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ status }) => {
  const getStatusConfig = (currentStatus: ProgressStatus): StatusConfig => {
    switch (currentStatus?.toLowerCase() as Lowercase<ProgressStatus>) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'var(--pgn-color-success-base)',
          altText: 'Completed',
        };
      case 'in progress':
        return {
          icon: Timelapse,
          color: 'var(--pgn-color-info-base)',
          altText: 'In progress',
        };
      default:
        return {
          icon: LmsCompletionSolid,
          color: 'var(--pgn-color-secondary-base)',
          altText: 'Not started',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Icon
      src={config.icon}
      aria-label={`Progress status: ${config.altText}`}
      className="progress-indicator"
      style={{
        color: `${config.color}`,
        zIndex: 2,
      }}
    />
  );
};

export default ProgressIndicator;
