import React from 'react';
import PropTypes from 'prop-types';
import { getConfig } from '@edx/frontend-platform';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Badge, Card, breakpoints, useMediaQuery,
} from '@openedx/paragon';

const messages = {
  startDate: {
    id: 'learningPaths.recommendedCourseCard.startDate',
    defaultMessage: 'Starts: {startDate}',
  },
};

const getFullImageUrl = (path) => {
  if (!path) {
    return '';
  }

  return new URL(path, `${getConfig().LMS_BASE_URL}/`).href;
};

const getStartDateDisplay = ({ start, advertisedStart }, intl) => (
  advertisedStart || (start ? intl.formatDate(new Date(start), {
    month: 'short', day: 'numeric', year: 'numeric',
  }) : '')
);

const RecommendedCourseCard = ({
  courseId,
  courseOrg,
  courseName,
  courseNumber,
  courseImageUrl,
  courseStartDate,
  courseAdvertisedStart,
  linkUrl,
  isLoading,
}) => {
  const intl = useIntl();
  const isExtraSmall = useMediaQuery({ maxWidth: breakpoints.small.maxWidth });
  const courseAboutPath = `/courses/${courseId}/about`;
  let cardLinkProps = { as: 'div' };
  if (linkUrl) {
    cardLinkProps = { as: 'a', href: linkUrl };
  } else if (courseId) {
    cardLinkProps = { as: 'a', href: `${getConfig().LMS_BASE_URL}${courseAboutPath}` };
  }
  const startDateDisplay = (courseStartDate || courseAdvertisedStart)
    ? getStartDateDisplay({ start: courseStartDate, advertisedStart: courseAdvertisedStart }, intl)
    : null;

  return (
    <Card
      {...cardLinkProps}
      className={`course-card d-flex ${isExtraSmall ? 'w-100' : 'course-card-desktop'}`}
      isClickable={!isLoading}
      isLoading={isLoading}
      data-testid="recommended-course-card"
    >
      {courseImageUrl || isLoading ? (
        <Card.ImageCap
          src={getFullImageUrl(courseImageUrl)}
          srcAlt={`${courseName || ''} ${courseNumber || ''}`.trim()}
          skeletonDuringImageLoad
        />
      ) : (
        <div className="course-card__image-fallback" />
      )}
      <Card.Header
        title={courseName}
        subtitle={(
          <>
            <div>{courseNumber}</div>
            <Badge variant="light">{courseOrg}</Badge>
          </>
        )}
        size="sm"
      />
      <Card.Footer
        textElement={startDateDisplay && intl.formatMessage(messages.startDate, {
          startDate: startDateDisplay,
        })}
      />
    </Card>
  );
};

RecommendedCourseCard.propTypes = {
  courseId: PropTypes.string,
  courseOrg: PropTypes.string,
  courseName: PropTypes.string,
  courseNumber: PropTypes.string,
  courseImageUrl: PropTypes.string,
  courseStartDate: PropTypes.string,
  courseAdvertisedStart: PropTypes.string,
  linkUrl: PropTypes.string,
  isLoading: PropTypes.bool,
};

RecommendedCourseCard.defaultProps = {
  courseId: undefined,
  courseOrg: undefined,
  courseName: undefined,
  courseNumber: undefined,
  courseImageUrl: undefined,
  courseStartDate: undefined,
  courseAdvertisedStart: undefined,
  linkUrl: undefined,
  isLoading: false,
};

export default RecommendedCourseCard;
