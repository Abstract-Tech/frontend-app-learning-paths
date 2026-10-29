import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Spinner,
  Card,
  Row,
  Icon,
  IconButton,
  Button,
  Alert,
  Chip,
} from '@openedx/paragon';
import {
  LmsBook,
  AccessTimeFilled,
  Award,
  Calendar,
  Person,
  Close,
  ChevronLeft,
} from '@openedx/paragon/icons';
import { useCourseDetail, useOrganizations, useCredentialConfiguration } from '../../data/queries';
import { buildAssetUrl, replaceStaticAssetReferences } from '../../../util/assetUrl';
import { sanitizeHtml } from '../../../util/sanitizeHtml';
import { buildCourseHomeUrl } from '../../utils';
import { useScreenSize } from '../../../hooks/useScreenSize';
import './CourseDetails.scss';

/* Rich text is sanitized by sanitizeHtml before rendering. */
/* eslint-disable react/no-danger */

const CourseDetailContent = ({
  course,
  isModalView = false,
  onClose,
  learningPathTitle,
}) => {
  const {
    name,
    shortDescription,
    endDate,
    duration,
    selfPaced,
    courseImageAssetPath,
    description,
    org,
  } = course;

  const dateDisplay = endDate
    ? new Date(endDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : null;

  const { isSmall } = useScreenSize();
  const navigate = useNavigate();
  const handleClose = onClose || (() => navigate(-1));
  const { courseKey: urlCourseKey } = useParams();
  const activeCourseKey = course.id || urlCourseKey;
  const handleViewClick = () => {
    const courseHomeUrl = buildCourseHomeUrl(activeCourseKey);
    if (courseHomeUrl) {
      window.location.href = courseHomeUrl;
    }
  };

  const { data: organizations = {} } = useOrganizations();
  const orgData = useMemo(() => ({
    name: organizations[org]?.name || org,
    logo: organizations[org]?.logo,
  }), [organizations, org]);

  const { data: credentialConfig } = useCredentialConfiguration(activeCourseKey);
  const hasCertificate = credentialConfig?.hasCredentials;

  return (
    <div className={isModalView ? 'course-detail course-detail--modal' : 'course-detail'}>
      <div className="hero">
        {isModalView && (
          <header className="course-detail__modal-header">
            <p className="course-detail__modal-path mb-0 text-truncate">
              <b>Learning Path:</b> {learningPathTitle}
            </p>
            <IconButton
              src={Close}
              iconAs={Icon}
              variant="primary"
              alt="Close course details"
              onClick={handleClose}
            />
          </header>
        )}
        {isModalView ? (
          <section className="course-detail__modal-hero">
            <Chip iconBefore={LmsBook} className="course-chip">COURSE</Chip>
            <h1 className="course-detail__modal-title">{name}</h1>
            <div
              className="course-detail__modal-subtitle text-muted"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(shortDescription || 'No description available.') }}
            />
          </section>
        ) : (
          <Card orientation={isSmall ? 'vertical' : 'horizontal'}>
            {isSmall && (
            <Card.ImageCap
              src={buildAssetUrl(courseImageAssetPath)}
              srcAlt={`${name} course image`}
              logoSrc={buildAssetUrl(orgData.logo)}
              logoAlt={`${orgData.name} logo`}
              className="mb-4"
            />
            )}
            <Card.Body>
              <Card.Section>
                <Link to="/" className="d-flex align-items-center back-link pl-4">
                  <Icon src={ChevronLeft} />
                  <span>Go Back</span>
                </Link>
              </Card.Section>
              <Card.Section className="pl-5 pr-6">
                <Chip iconBefore={LmsBook} className="course-chip">COURSE</Chip>
                <h1 className={`my-3 mt-4.5${isSmall ? ' h2' : ''}`}>{name}</h1>
                <div
                  className="text-muted"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(shortDescription || 'No description available.') }}
                />
              </Card.Section>
            </Card.Body>
            {!isSmall && (
              <Card.ImageCap
                src={buildAssetUrl(courseImageAssetPath)}
                srcAlt={`${name} course image`}
                logoSrc={buildAssetUrl(orgData.logo)}
                logoAlt={`${orgData.name} logo`}
              />
            )}
          </Card>
        )}
        <Row className={`mx-0 px-5 px-md-6 flex-column flex-md-row align-items-start hero-info course-hero-info ${isModalView ? 'course-detail__modal-facts' : 'my-4'}`}>
          {dateDisplay && (
            <div className="d-flex align-items-center">
              <Icon src={AccessTimeFilled} className="mr-4 mb-3.5" />
              <div>
                <p className="mb-0 font-weight-bold">{dateDisplay}</p>
                <p className="mb-0 text-muted">Access ends</p>
              </div>
            </div>
          )}
          {hasCertificate && (
            <div className="d-flex align-items-center">
              <Icon src={Award} className="mr-4 mb-3.5" />
              <div>
                <p className="mb-0 font-weight-bold">Certificate</p>
                <p className="mb-0 text-muted">Earn a certificate</p>
              </div>
            </div>
          )}
          {duration && (
            <div className="d-flex align-items-center">
              <Icon src={Calendar} className="mr-4 mb-3.5" />
              <div>
                <p className="mb-0 font-weight-bold">{duration}</p>
                <p className="mb-0 text-muted">Approx. duration</p>
              </div>
            </div>
          )}
          <div className="d-flex align-items-center">
            <Icon src={Person} className="mr-4 mb-3.5" />
            <div>
              <p className="mb-0 font-weight-bold">{selfPaced ? 'Self-paced' : 'Instructor-paced'}</p>
              <p className="mb-0 text-muted">
                {selfPaced ? 'Progress at your own speed' : 'Follow the course schedule'}
              </p>
            </div>
          </div>
        </Row>
      </div>

      {!isModalView && (
        <div className="tabs d-flex align-items-center pl-5.5 pr-0">
          <Button
            variant="primary"
            className="ml-auto rounded-0 py-3 px-5.5 "
            onClick={handleViewClick}
          >
            View
          </Button>
        </div>
      )}

      <div className={isModalView ? 'course-detail__modal-description' : 'py-3'}>
        <section id="about">
          {/* eslint-disable-next-line react/no-danger */}
          <div dangerouslySetInnerHTML={{
            __html: sanitizeHtml(
              replaceStaticAssetReferences(description || shortDescription || 'No description available.', course.id),
            ),
          }}
          />
        </section>
      </div>
    </div>
  );
};

CourseDetailContent.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    shortDescription: PropTypes.string,
    endDate: PropTypes.string,
    duration: PropTypes.string,
    selfPaced: PropTypes.bool,
    courseImageAssetPath: PropTypes.string,
    description: PropTypes.string,
    org: PropTypes.string,
  }).isRequired,
  isModalView: PropTypes.bool,
  onClose: PropTypes.func,
  learningPathTitle: PropTypes.string,
};

const CourseDetailPage = ({
  isModalView = false,
  onClose,
  courseKey: propCourseKey,
  learningPathTitle,
}) => {
  const { courseKey: urlCourseKey } = useParams();
  const courseKey = propCourseKey || urlCourseKey;

  const {
    data: course,
    isLoading,
    error,
  } = useCourseDetail(courseKey);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error loading course</Alert.Heading>
        <p>{error.message}</p>
        <Link to="/">Return to dashboard</Link>
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert variant="info">
        <Alert.Heading>Course not found</Alert.Heading>
        <p>We couldn&apos;t find the requested course.</p>
        <Link to="/">Return to dashboard</Link>
      </Alert>
    );
  }

  const courseWithFallbacks = {
    ...course,
    shortDescription: course.shortDescription || '',
    description: course.description || course.shortDescription || '',
    duration: course.duration || '',
  };

  return (
    <div className={`detail-page course-detail-page ${isModalView ? 'course-detail-page--modal' : ''}`}>
      <CourseDetailContent
        course={courseWithFallbacks}
        isModalView={isModalView}
        onClose={onClose}
        learningPathTitle={learningPathTitle}
      />
    </div>
  );
};

CourseDetailPage.propTypes = {
  isModalView: PropTypes.bool,
  onClose: PropTypes.func,
  courseKey: PropTypes.string,
  learningPathTitle: PropTypes.string,
};

export default CourseDetailPage;
