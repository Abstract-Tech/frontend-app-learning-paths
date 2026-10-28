import React from 'react';
import { DIRECT_PLUGIN, PLUGIN_OPERATIONS } from '@openedx/frontend-plugin-framework';

const LearningPathsHeaderPlugin = () => (
  <div
    style={{
      padding: '0.5rem 1rem',
      backgroundColor: 'var(--pgn-color-primary-100)',
      color: 'var(--pgn-color-primary-900)',
      textAlign: 'center',
    }}
  >
    Learning paths header plugin is active
  </div>
);

const LearningPathsFooterPlugin = () => (
  <div
    style={{
      padding: '0.75rem 1rem',
      color: 'var(--pgn-color-primary-900)',
      textAlign: 'center',
    }}
  >
    Learning paths footer plugin is active
  </div>
);

const config = {
  ...process.env,
  pluginSlots: {
    'org.openedx.frontend.layout.header_learning.v1': {
      keepDefault: false,
      plugins: [
        {
          op: PLUGIN_OPERATIONS.Insert,
          widget: {
            id: 'learning-paths-demo-header-plugin',
            type: DIRECT_PLUGIN,
            priority: 1,
            RenderWidget: LearningPathsHeaderPlugin,
          },
        },
      ],
    },
    'org.openedx.frontend.layout.footer.v1': {
      keepDefault: false,
      plugins: [
        {
          op: PLUGIN_OPERATIONS.Insert,
          widget: {
            id: 'learning-paths-demo-footer-plugin',
            type: DIRECT_PLUGIN,
            priority: 1,
            RenderWidget: LearningPathsFooterPlugin,
          },
        },
      ],
    },
  },
};

export default config;
