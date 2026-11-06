import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Card, Button, ProgressBar, Chip, Icon, Alert,
} from '@openedx/paragon';
import {
  School,
  AccessTime,
  CheckCircle,
  LmsCompletionSolid,
  Timelapse,
  FormatListBulleted,
} from '@openedx/paragon/icons';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { buildAssetUrl } from '../../../util/assetUrl';
import {
  usePrefetchCourseDetail, useCourseEnrollmentStatus, useEnrollCourse, useOrganizations,
} from '../../data/queries';
import { buildCourseHomeUrl } from '../../utils';
import { useScreenSize } from '../../../hooks/useScreenSize';
import '../StatusChip.scss';
import './CourseCard.scss';

export const CourseCard = ({
  course, relatedLearningPaths, onClick, onClickViewButton, isEnrolledInLearningPath, showFilters = false,
}) => {
  const {
    name,
    org,
    courseImageAssetPath,
    startDate,
    endDate,
    status,
    percent,
    hasUnearnedOptionalCompletion,
    checkingEnrollment,
    access,
  } = course;

  const { administrator } = getAuthenticatedUser() || {};
  const { isSmall, isMedium } = useScreenSize();
  const orientation = (showFilters && (isSmall || isMedium)) || (!showFilters && isSmall) ? 'vertical' : 'horizontal';

  // Prefetch the course detail when the user hovers over the card.
  const prefetchCourseDetail = usePrefetchCourseDetail(course.id);
  const handleMouseEnter = () => {
    prefetchCourseDetail();
  };

  const progressBarPercent = useMemo(() => +(percent * 100).toFixed(1), [percent]);

  const linkTo = buildCourseHomeUrl(course.id);

  const normalizedStatus = status?.toLowerCase() || '';
  let statusVariant = 'dark';
  let statusIcon = LmsCompletionSolid;
  let buttonText = 'View';
  switch (normalizedStatus) {
    case 'completed':
      statusVariant = 'success';
      statusIcon = CheckCircle;
      break;
    case 'not started':
      statusVariant = 'secondary';
      statusIcon = LmsCompletionSolid;
      buttonText = 'Start';
      break;
    case 'in progress':
      statusVariant = 'info';
      statusIcon = Timelapse;
      buttonText = 'Resume';
      break;
    default:
      break;
  }

  if (checkingEnrollment) {
    buttonText = 'Loading...';
  }

  const hasStaffAccess = administrator || access?.isStaff;
  const disableStartButton = !hasStaffAccess && (checkingEnrollment || isEnrolledInLearningPath === false);
  let showStartButton = true;

  let accessText = '';
  const currentDate = new Date();

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  // Determine access text and override button text based on access dates.
  if (startDateObj && startDateObj > currentDate) {
    // Course will start in the future.
    const startDateStr = startDateObj.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
    accessText = <>Access starts on <b>{startDateStr}</b></>;
    buttonText = 'Start';
    showStartButton = !course.access?.isTooEarly || hasStaffAccess;
  } else if (endDateObj) {
    const endDateStr = endDateObj.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
    if (currentDate > endDateObj) {
      // Course has ended.
      accessText = <>Access ended on <b>{endDateStr}</b></>;
      buttonText = 'View';
      // Remove status, as learners cannot do anything to change it at this point.
      if (normalizedStatus !== 'completed') {
        statusVariant = '';
      }
    } else {
      // Course is currently available.
      accessText = <>Access until <b>{endDateStr}</b></>;
    }
  }

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  return (
    <>
      <Card orientation={orientation} className={`learning-content-card course-content-card ${orientation}`} onMouseEnter={handleMouseEnter}>
        <Card.ImageCap
          src={buildAssetUrl(courseImageAssetPath)}
          srcAlt={`${name} course image`}
          logoSrc={buildAssetUrl(orgData.logo)}
          logoAlt={`${orgData.name} logo`}
          className={orientation}
        />
        <Card.Body className="d-flex flex-column">
          <Card.Section className="pb-2.5 d-flex flex-grow-0 justify-content-between chip-section">
            <Chip iconBefore={School} className="border-0 p-0 course-chip">COURSE</Chip>
            {!!statusVariant && (
              <Chip iconBefore={statusIcon} className={`pl-1 status-chip status-${statusVariant}`}>
                {normalizedStatus.toUpperCase() || 'UNKNOWN'}
              </Chip>
            )}
          </Card.Section>
          <Card.Section className="course-card-title pt-4 pt-md-1 pb-1"><h3>{name}</h3></Card.Section>
          <Card.Section className="course-card-progress pt-1 pb-1">
            {normalizedStatus === 'in progress' && !!statusVariant && (
              <ProgressBar
                now={progressBarPercent}
                label={progressBarPercent === 0 ? '0' : `${progressBarPercent}%`}
                variant="primary"
                aria-label="Course progress"
              />
            )}
            {normalizedStatus === 'completed' && hasUnearnedOptionalCompletion && (
              <div className="small">You&apos;ve completed all required content. Remaining content is optional.</div>
            )}
          </Card.Section>
          {relatedLearningPaths && relatedLearningPaths.length > 0 && (
            <Card.Section className="course-related-paths">
              <div className="course-related-paths-label">
                <Icon src={FormatListBulleted} />
                <span>
                  {relatedLearningPaths.length > 1
                    ? 'This course is included in these learning paths:'
                    : 'This course is part of the learning path:'}
                </span>
              </div>
              <div className="course-related-paths-list">
                {relatedLearningPaths.map((learningPath) => (
                  <Link
                    key={`${course.id}-${learningPath.key}`}
                    to={`/learningpath/${encodeURIComponent(learningPath.key)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="course-related-path-link"
                    aria-label={`View learning path: ${learningPath.name}`}
                  >
                    {learningPath.name}
                  </Link>
                ))}
              </div>
            </Card.Section>
          )}
          <Card.Footer orientation="horizontal" className="course-card-footer pt-3 pb-3 justify-content-between">
            <Card.Section className="d-flex p-0 flex-column-reverse flex-md-row align-items-start w-100 w-md-auto">
              {accessText && (
                <Chip iconBefore={AccessTime} className="border-0 pb-1 pb-md-0 p-0">{accessText}</Chip>
              )}
            </Card.Section>
            <div className="d-flex align-self-end ml-auto">
              {onClickViewButton && (
                <Button variant="brand" onClick={onClickViewButton} className="mr-2 text-nowrap">More Info</Button>
              )}
              {showStartButton && (
                onClick ? (
                  <Button variant="brand" onClick={onClick} disabled={disableStartButton}>
                    {buttonText}
                  </Button>
                ) : (
                  <Button
                    as="a"
                    href={disableStartButton ? undefined : linkTo}
                    onClick={disableStartButton ? (event) => event.preventDefault() : undefined}
                    variant="brand"
                    disabled={disableStartButton}
                  >
                    {buttonText}
                  </Button>
                )
              )}
            </div>
          </Card.Footer>
        </Card.Body>
      </Card>
    </>
  );
};

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    org: PropTypes.string.isRequired,
    courseImageAssetPath: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    status: PropTypes.string.isRequired,
    percent: PropTypes.number.isRequired,
    hasOptionalCompletion: PropTypes.bool,
    hasUnearnedOptionalCompletion: PropTypes.bool,
    checkingEnrollment: PropTypes.bool,
    access: PropTypes.shape({
      isStaff: PropTypes.bool.isRequired,
      isTooEarly: PropTypes.bool.isRequired,
    }),
  }).isRequired,
  relatedLearningPaths: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
  })),
  onClick: PropTypes.func,
  onClickViewButton: PropTypes.func,
  isEnrolledInLearningPath: PropTypes.bool,
  showFilters: PropTypes.bool,
};

export const CourseCardWithEnrollment = ({
  course, learningPathId, isEnrolledInLearningPath, onClick,
}) => {
  const { data: enrollmentStatus, isLoading: checkingEnrollment } = useCourseEnrollmentStatus(course.id);
  const [enrolling, setEnrolling] = useState(false);
  const [actionError, setActionError] = useState(null);
  const enrollCourseMutation = useEnrollCourse(learningPathId);

  const courseWithEnrollment = {
    ...course,
    isEnrolledInCourse: enrollmentStatus?.isEnrolled || false,
    checkingEnrollment: checkingEnrollment || enrolling,
  };

  // Defined here because calling the MFE config API from an async function can randomly fail.
  const courseHomeUrl = buildCourseHomeUrl(course.id);

  const handleCourseAction = async () => {
    const { administrator } = getAuthenticatedUser() || {};
    setActionError(null);

    if (courseWithEnrollment.isEnrolledInCourse || administrator) {
      if (courseHomeUrl) {
        window.location.href = courseHomeUrl;
      }
      return;
    }

    setEnrolling(true);
    try {
      const result = await enrollCourseMutation.mutateAsync(course.id);
      if (result.success) {
        if (courseHomeUrl) {
          window.location.href = courseHomeUrl;
        }
      } else {
        setActionError('We couldn\'t start this course. Please try again.');
        // eslint-disable-next-line no-console
        console.error('Failed to enroll in the course:', result.data?.error || 'Unknown error');
      }
    } catch (error) {
      setActionError('We couldn\'t start this course. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Failed to enroll in the course:', error);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <>
      <CourseCard
        course={courseWithEnrollment}
        onClick={handleCourseAction}
        onClickViewButton={onClick}
        isEnrolledInLearningPath={isEnrolledInLearningPath}
      />
      {actionError && <Alert variant="danger" className="mt-2">{actionError}</Alert>}
    </>
  );
};

CourseCardWithEnrollment.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  learningPathId: PropTypes.string.isRequired,
  isEnrolledInLearningPath: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};
