import React, {
  useState, useMemo, useEffect, useRef,
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

const STORAGE_KEYS = {
  showFilters: 'lp_dashboard_showFilters',
  selectedContentType: 'lp_dashboard_contentType',
  selectedStatuses: 'lp_dashboard_selectedStatuses',
  selectedDateStatuses: 'lp_dashboard_selectedDateStatuses',
  selectedOrgs: 'lp_dashboard_selectedOrgs',
};

const readStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) {
      return fallback;
    }
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(fallback) && !Array.isArray(parsedValue) ? fallback : parsedValue;
  } catch {
    return fallback;
  }
};

const writeStoredValue = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
};

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

const getDateStatus = (item) => {
  const currentDate = new Date();
  const { startDate, endDate } = getItemDates(item);

  if (startDate && startDate > currentDate) {
    return 'Upcoming';
  }
  if (endDate && endDate < currentDate) {
    return 'Ended';
  }
  return 'Open';
};

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
  const filterPanelRef = useRef(null);
  const filterButtonRef = useRef(null);

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

  const [showFilters, setShowFilters] = useState(() => readStoredValue(STORAGE_KEYS.showFilters, false));
  const [selectedContentType, setSelectedContentType] = useState(
    () => {
      const storedContentType = readStoredValue(STORAGE_KEYS.selectedContentType, 'All');
      return ['All', 'course', 'learning_path'].includes(storedContentType) ? storedContentType : 'All';
    },
  );
  const [selectedStatuses, setSelectedStatuses] = useState(
    () => readStoredValue(STORAGE_KEYS.selectedStatuses, []),
  );
  const [selectedDateStatuses, setSelectedDateStatuses] = useState(
    () => readStoredValue(STORAGE_KEYS.selectedDateStatuses, []),
  );
  const [selectedOrgs, setSelectedOrgs] = useState(
    () => readStoredValue(STORAGE_KEYS.selectedOrgs, []),
  );

  useEffect(() => { writeStoredValue(STORAGE_KEYS.showFilters, showFilters); }, [showFilters]);
  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.selectedContentType, selectedContentType);
  }, [selectedContentType]);
  useEffect(() => { writeStoredValue(STORAGE_KEYS.selectedStatuses, selectedStatuses); }, [selectedStatuses]);
  useEffect(() => {
    writeStoredValue(STORAGE_KEYS.selectedDateStatuses, selectedDateStatuses);
  }, [selectedDateStatuses]);
  useEffect(() => { writeStoredValue(STORAGE_KEYS.selectedOrgs, selectedOrgs); }, [selectedOrgs]);

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

  useEffect(() => {
    if (!showFilters || !isSmall) {
      return undefined;
    }

    const firstFocusable = filterPanelRef.current?.querySelector(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    const trigger = filterButtonRef.current;
    return () => trigger?.focus();
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
  }), [items, selectedContentType, selectedStatuses, selectedDateStatuses, selectedOrgs, searchQuery]);

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
  }, [filteredItems]);

  const configuredPageSize = Number.parseInt(getConfig().DASHBOARD_PAGE_SIZE, 10);
  const PAGE_SIZE = Number.isFinite(configuredPageSize) && configuredPageSize > 0 ? configuredPageSize : 10;
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
        {isLoading && (
          <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner animation="border" variant="primary" />
          </div>
        )}
        {!isLoading && error && (
          <div className="dashboard-error d-flex flex-column align-items-center text-center py-5" role="alert">
            <Alert variant="danger" className="mb-3">
              We couldn&apos;t load your learning content. Please try again.
            </Alert>
            <Button variant="primary" onClick={handleRetry}>
              Try again
            </Button>
          </div>
        )}
        {!isLoading && !error && (
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
                  id="learning-path-filter-dialog"
                  ref={filterPanelRef}
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
                        ref={filterButtonRef}
                        src={FilterList}
                        iconAs={Icon}
                        variant="black"
                        alt="Filter"
                        aria-expanded={showFilters}
                        aria-haspopup="dialog"
                        aria-controls="learning-path-filter-dialog"
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
                        ref={filterButtonRef}
                        variant="outline-primary"
                        aria-expanded={showFilters}
                        aria-haspopup="dialog"
                        aria-controls="learning-path-filter-dialog"
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
                          id="learning-path-filter-dialog"
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
