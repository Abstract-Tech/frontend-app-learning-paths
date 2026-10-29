import React, {
  useState, useMemo, useEffect, useRef, useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Spinner, Col, Button, Pagination, Icon, IconButton, SearchField, Image, Bubble, Alert,
} from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { FilterList, Search } from '@openedx/paragon/icons';
import { useLearningPaths, useLearnerDashboard, useOrganizations } from '../../data/queries';
import LearningPathCard from '../../components/LearningPathCard';
import { CourseCard } from '../../components/CourseCard/CourseCard';
import FilterPanel from '../../components/FilterPanel';
import { useScreenSize } from '../../../hooks/useScreenSize';
import noResultsSVG from '../../../assets/no_results.svg';
import './Dashboard.scss';

const Dashboard = () => {
  const { isSmall } = useScreenSize();
  const { administrator } = getAuthenticatedUser() || {};

  const {
    data: learningPaths,
    isLoading: isLoadingPaths,
    error: pathsError,
    refetch: refetchPaths,
  } = useLearningPaths();

  const {
    data: learnerDashboardData,
    isLoading: isLoadingCourses,
    error: coursesError,
    refetch: refetchCourses,
  } = useLearnerDashboard();

  const {
    data: organizations,
    isLoading: isLoadingOrgs,
    error: organizationsError,
    refetch: refetchOrganizations,
  } = useOrganizations();

  const courses = learnerDashboardData?.courses;
  const emailConfirmation = learnerDashboardData?.emailConfirmation;
  const enterpriseDashboard = learnerDashboardData?.enterpriseDashboard;

  const isLoading = isLoadingPaths || isLoadingCourses || isLoadingOrgs;
  const error = pathsError || coursesError || organizationsError;

  useEffect(() => {
    if (!error) {
      return;
    }

    // eslint-disable-next-line no-console
    console.error('Error loading data:', error);
  }, [error]);

  const items = useMemo(() => {
    // If email confirmation is needed, return empty array to hide all items.
    if (emailConfirmation?.isNeeded) {
      return [];
    }
    return [...(courses || []), ...(learningPaths || [])];
  }, [courses, learningPaths, emailConfirmation]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchRef = useRef(null);
  const desktopFilterControlRef = useRef(null);

  const handleMobileSearchClick = () => {
    setShowMobileSearch(true);
    // Focus the search field after it becomes visible.
    setTimeout(() => {
      if (mobileSearchRef.current) {
        const inputElement = mobileSearchRef.current.querySelector('input');
        if (inputElement) {
          inputElement.focus();
        }
      }
    }, 0);
  };

  const handleMobileSearchBlur = () => {
    // Hide mobile search when user taps outside and the search query is empty.
    if (isSmall && !searchQuery) {
      setShowMobileSearch(false);
    }
  };

  const showFiltersKey = 'lp_dashboard_showFilters';
  const selectedContentTypeKey = 'lp_dashboard_contentType';
  const selectedStatusesKey = 'lp_dashboard_selectedStatuses';
  const selectedDateStatusesKey = 'lp_dashboard_selectedDateStatuses';
  const selectedOrgsKey = 'lp_dashboard_selectedOrgs';

  const [showFilters, setShowFilters] = useState(() => localStorage.getItem(showFiltersKey) === 'true');
  const [selectedContentType, setSelectedContentType] = useState(() => localStorage.getItem(selectedContentTypeKey) || 'All');
  const [selectedStatuses, setSelectedStatuses] = useState(
    () => JSON.parse(localStorage.getItem(selectedStatusesKey)) || [],
  );
  const [selectedDateStatuses, setSelectedDateStatuses] = useState(
    () => JSON.parse(localStorage.getItem(selectedDateStatusesKey)) || [],
  );
  const [selectedOrgs, setSelectedOrgs] = useState(
    () => JSON.parse(localStorage.getItem(selectedOrgsKey)) || [],
  );

  useEffect(() => { localStorage.setItem(showFiltersKey, showFilters.toString()); }, [showFilters]);
  useEffect(() => {
    localStorage.setItem(selectedContentTypeKey, selectedContentType.toString());
  }, [selectedContentType]);
  useEffect(() => { localStorage.setItem(selectedStatusesKey, JSON.stringify(selectedStatuses)); }, [selectedStatuses]);
  useEffect(() => {
    localStorage.setItem(selectedDateStatusesKey, JSON.stringify(selectedDateStatuses));
  }, [selectedDateStatuses]);
  useEffect(() => { localStorage.setItem(selectedOrgsKey, JSON.stringify(selectedOrgs)); }, [selectedOrgs]);

  useEffect(() => {
    if (!showFilters) {
      return undefined;
    }

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setShowFilters(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFilters]);

  useEffect(() => {
    if (!showFilters || isSmall) {
      return undefined;
    }

    const handleOutsideClick = event => {
      if (!desktopFilterControlRef.current?.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showFilters, isSmall]);

  const handleStatusChange = (status, isChecked) => {
    setSelectedStatuses(prev => {
      if (isChecked) {
        return [...prev, status];
      }
      return prev.filter(s => s !== status);
    });
  };

  const handleDateStatusChange = (dateStatus, isChecked) => {
    setSelectedDateStatuses(prev => {
      if (isChecked) {
        return [...prev, dateStatus];
      }
      return prev.filter(s => s !== dateStatus);
    });
  };

  const handleOrgChange = (org, isChecked) => {
    setSelectedOrgs(prev => {
      if (isChecked) {
        return [...prev, org];
      }
      return prev.filter(s => s !== org);
    });
  };

  const handleClearFilters = () => {
    setSelectedContentType('All');
    setSelectedStatuses([]);
    setSelectedDateStatuses([]);
    setSelectedOrgs([]);
  };

  // Get only the organizations that are present in the user's items.
  const availableOrganizations = useMemo(() => {
    if (!organizations || !items.length) { return []; }

    const availableOrgKeys = new Set();
    items.forEach(item => {
      if (item.org) {
        availableOrgKeys.add(item.org);
      }
    });

    return Array.from(availableOrgKeys, orgKey => organizations[orgKey])
      .filter(Boolean)
      .sort((a, b) => (a.name || a.shortName).localeCompare(b.name || b.shortName));
  }, [organizations, items]);

  const activeFiltersCount = useMemo(
    () => (selectedContentType !== 'All') + selectedStatuses.length + selectedDateStatuses.length + selectedOrgs.length,
    [selectedContentType, selectedStatuses, selectedDateStatuses, selectedOrgs],
  );

  const getItemDates = (item) => {
    if (item.type === 'course') {
      return {
        startDate: item.startDate ? new Date(item.startDate) : null,
        endDate: item.endDate ? new Date(item.endDate) : null,
      };
    }
    if (item.type === 'learning_path') {
      return {
        startDate: item.minDate ? new Date(item.minDate) : null,
        endDate: item.maxDate ? new Date(item.maxDate) : null,
      };
    }
    return { startDate: null, endDate: null };
  };

  const getDateStatus = useCallback((item) => {
    const currentDate = new Date();
    const { startDate, endDate } = getItemDates(item);

    if (startDate && startDate > currentDate) {
      return 'Upcoming';
    }
    if (endDate && endDate < currentDate) {
      return 'Ended';
    }
    return 'Open';
  }, []);

  const filteredItems = useMemo(() => items.filter(item => {
    const typeMatch = selectedContentType === 'All'
      || (selectedContentType === 'course' && item.type === 'course')
      || (selectedContentType === 'learning_path' && item.type === 'learning_path');
    const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
    const dateStatusMatch = selectedDateStatuses.length === 0 || selectedDateStatuses.includes(getDateStatus(item));
    const orgMatch = selectedOrgs.length === 0 || selectedOrgs.includes(item.org);
    const searchMatch = searchQuery === ''
      || (item.displayName && item.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
      || (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return typeMatch && statusMatch && dateStatusMatch && orgMatch && searchMatch;
  }), [items, selectedContentType, selectedStatuses, selectedDateStatuses, selectedOrgs, searchQuery, getDateStatus]);

  const sortedItems = useMemo(() => {
    const statusOrder = { 'not started': 1, 'in progress': 2, completed: 3 };
    const dateStatusOrder = { Upcoming: 1, Open: 2, Ended: 3 };

    return [...filteredItems].sort((a, b) => {
      // 1. Sort by start date category.
      const dateStatusA = dateStatusOrder[getDateStatus(a)] || 999;
      const dateStatusB = dateStatusOrder[getDateStatus(b)] || 999;

      if (dateStatusA !== dateStatusB) {
        return dateStatusA - dateStatusB;
      }

      // 2. Sort by progress status.
      const statusA = statusOrder[a.status?.toLowerCase()] || 999;
      const statusB = statusOrder[b.status?.toLowerCase()] || 999;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // 3. Sort alphabetically by name.
      const nameA = (a.displayName || a.name || '').toLowerCase();
      const nameB = (b.displayName || b.name || '').toLowerCase();

      return nameA.localeCompare(nameB);
    });
  }, [filteredItems, getDateStatus]);

  const PAGE_SIZE = getConfig().DASHBOARD_PAGE_SIZE || 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(sortedItems.length / PAGE_SIZE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, currentPage, PAGE_SIZE]);

  const showingCount = Math.max(0, Math.min(PAGE_SIZE, sortedItems.length - (currentPage - 1) * PAGE_SIZE));
  const totalCount = sortedItems.length;

  useEffect(() => {
    // Add a timeout to ensure DOM updates are complete.
    const id = setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 10);
    return () => clearTimeout(id);
  }, [currentPage]);
  // Reset pagination when using filters or search.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedContentType, selectedStatuses, selectedDateStatuses, selectedOrgs]);

  const handleRetry = () => {
    refetchPaths();
    refetchCourses();
    refetchOrganizations();
  };

  return (
    <>
      {emailConfirmation?.isNeeded && (
        <Alert variant="warning" className="account-activation m-0 p-2 rounded-0 text-center">
          Activate your account! Check your inbox for an account activation link from {getConfig().SITE_NAME}.
          If you need help, <Link to={`${getConfig().LMS_BASE_URL}/contact`} target="_blank" rel="noopener noreferrer">contact us</Link>.
        </Alert>
      )}
      {!emailConfirmation?.isNeeded && enterpriseDashboard?.isLearnerPortalEnabled && (
        <Alert variant="info" className="enterprise-dashboard m-0 rounded-0 text-center">
          Your affiliation with <b>{enterpriseDashboard?.label || 'enterprise'}</b> provides access to additional courses. Check the {' '}
          <Link to={`${enterpriseDashboard?.url}?utm_source=lms_dashboard_banner`}>
            Course Finder
          </Link> to discover them.
        </Alert>
      )}
      <div className="dashboard">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <div className="dashboard-error d-flex flex-column align-items-center text-center py-5" role="alert">
            <Alert variant="danger" className="mb-3">
              We couldn&apos;t load your learning content. Please try again.
            </Alert>
            <Button variant="primary" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            {showFilters && isSmall && (
              <>
                <button
                  type="button"
                  className="filter-backdrop"
                  aria-label="Close filters"
                  onClick={() => setShowFilters(false)}
                />
                <div
                  className="filter-panel sidebar position-fixed open mobile"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="learning-path-filter-title"
                >
                  <FilterPanel
                    selectedContentType={selectedContentType}
                    onSelectContentType={setSelectedContentType}
                    selectedStatuses={selectedStatuses}
                    onChangeStatus={handleStatusChange}
                    selectedDateStatuses={selectedDateStatuses}
                    onChangeDateStatus={handleDateStatusChange}
                    selectedOrgs={selectedOrgs}
                    onChangeOrg={handleOrgChange}
                    organizations={availableOrganizations}
                    onClose={() => setShowFilters(false)}
                    isSmall
                    onClearAll={handleClearFilters}
                  />
                </div>
              </>
            )}
            <div className={`dashboard-content ${showFilters && isSmall ? 'd-none' : ''}`}>
              <div className="dashboard-header d-flex justify-content-between align-items-center">
                <h1>My Learning</h1>
                {!isSmall ? (
                  <SearchField
                    onClear={() => setSearchQuery('')}
                    onChange={setSearchQuery}
                    value={searchQuery}
                    placeholder="Search"
                  />
                ) : (
                  <div>
                    <IconButton src={Search} iconAs={Icon} variant="black" alt="Search" onClick={handleMobileSearchClick} />
                    <div className="d-inline-block position-relative">
                      <IconButton
                        src={FilterList}
                        iconAs={Icon}
                        variant="black"
                        alt="Filter"
                        aria-expanded={showFilters}
                        onClick={() => setShowFilters(true)}
                      />
                      {activeFiltersCount > 0 && (
                        <Bubble
                          className="filter-active-count"
                          aria-label={`${activeFiltersCount} active filters`}
                        >
                          {activeFiltersCount}
                        </Bubble>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {isSmall && showMobileSearch && (
                <div className="mobile-search" ref={mobileSearchRef}>
                  <SearchField
                    onClear={() => setSearchQuery('')}
                    onChange={setSearchQuery}
                    onBlur={handleMobileSearchBlur}
                    value={searchQuery}
                    placeholder="Search"
                  />
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center my-4">
                <div className="dashboard-toolbar-actions d-flex align-items-center">
                  {!isSmall && (
                    <div ref={desktopFilterControlRef} className="filter-control position-relative">
                      <Button
                        variant="outline-primary"
                        aria-expanded={showFilters}
                        onClick={() => setShowFilters(prev => !prev)}
                      >
                        <Icon src={FilterList} /> Filter
                      </Button>
                      {activeFiltersCount > 0 && (
                        <Bubble
                          className="filter-active-count"
                          aria-label={`${activeFiltersCount} active filters`}
                        >
                          {activeFiltersCount}
                        </Bubble>
                      )}
                      {showFilters && (
                        <div
                          className="filter-panel sidebar position-absolute open"
                          role="dialog"
                          aria-modal="false"
                          aria-labelledby="learning-path-filter-title"
                        >
                          <FilterPanel
                            selectedContentType={selectedContentType}
                            onSelectContentType={setSelectedContentType}
                            selectedStatuses={selectedStatuses}
                            onChangeStatus={handleStatusChange}
                            selectedDateStatuses={selectedDateStatuses}
                            onChangeDateStatus={handleDateStatusChange}
                            selectedOrgs={selectedOrgs}
                            onChangeOrg={handleOrgChange}
                            organizations={availableOrganizations}
                            onClose={() => setShowFilters(false)}
                            isSmall={false}
                            onClearAll={handleClearFilters}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {administrator && (
                    <Button as={Link} to="/create" variant="primary">
                      Create
                    </Button>
                  )}
                </div>
                <div className="small text-muted" aria-live="polite">
                  Showing <b>{showingCount}</b> of <b>{totalCount}</b>
                </div>
              </div>
              <hr className={`mt-0 mb-4 ${showFilters || isSmall ? 'invisible' : 'visible'}`} />
              {sortedItems.length === 0 ? (
                <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
                  <Image src={noResultsSVG} alt="No results" className="mb-4" />
                  <div>
                    <div className="h3 my-2">No matching results</div>
                    <div className="text-muted">Try another search or clear your filters</div>
                  </div>
                </div>
              ) : (
                <>
                  {paginatedItems.map(item => (
                    <Col xs={12} key={item.id || item.key} className="dashboard-item p-0 mb-4 mr-auto mx-auto">
                      {item.type === 'course'
                        ? (
                          <CourseCard
                            course={item}
                            relatedLearningPaths={item.learningPaths}
                            showFilters={showFilters}
                          />
                        )
                        : <LearningPathCard learningPath={item} showFilters={showFilters} />}
                    </Col>
                  ))}
                  <Pagination
                    paginationLabel="learning items navigation"
                    variant={isSmall ? 'reduced' : 'default'}
                    pageCount={totalPages}
                    currentPage={currentPage}
                    onPageSelect={page => setCurrentPage(page)}
                    className="d-flex justify-content-center mt-4"
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
