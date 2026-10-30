import 'core-js/stable';
import 'regenerator-runtime/runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, mergeConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom/client';
import { Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Container } from '@openedx/paragon';

import { FooterSlot } from '@edx/frontend-component-footer';
import messages from './i18n';
import queryClient from './queryClient';
import Dashboard from './learningpath/pages/Dashboard/Dashboard';
import LearningPathDetailPage from './learningpath/pages/LearningPathDetails/LearningPathDetails';
import CourseDetailPage from './learningpath/pages/CourseDetails/CourseDetails';
import CreateLearningPathPage from './learningpath/pages/CreateLearningPath/CreateLearningPath';
import EditLearningPathPage from './learningpath/pages/EditLearningPath/EditLearningPath';
import HeaderSlot from './plugin-slots/HeaderSlot';

import './index.scss';
import './setupConsoleOverride';

subscribe(APP_READY, () => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <AppProvider store={null}>
      <QueryClientProvider client={queryClient}>
        <div className="learning-paths-app">
          <HeaderSlot />
          <main id="main-content">
            <Container fluid size="xl">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<CreateLearningPathPage />} />
                <Route path="/edit/:key" element={<EditLearningPathPage />} />
                <Route path="/learningpath/:key/*" element={<LearningPathDetailPage />} />
                <Route path="/course/:courseKey" element={<CourseDetailPage />} />
              </Routes>
            </Container>
          </main>
          <FooterSlot />
        </div>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </AppProvider>,
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<ErrorPage message={error.message} />);
});

initialize({
  messages,
  requireAuthenticatedUser: true,
  handlers: {
    config: () => {
      mergeConfig({
        DASHBOARD_PAGE_SIZE: process.env.DASHBOARD_PAGE_SIZE || null,
      }, 'LearningPathsConfig');
    },
  },
});
