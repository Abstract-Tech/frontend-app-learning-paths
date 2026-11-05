import React, { useEffect, useState } from 'react';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { useIntl } from '@edx/frontend-platform/i18n';
import { CardGrid } from '@openedx/paragon';

import RecommendedCourseCard from './RecommendedCourseCard';

const RECOMMENDED_COURSES_LIMIT = 3;

const messages = {
  heading: {
    id: 'learningPaths.recommendedCourses.heading',
    defaultMessage: 'Recommended courses',
  },
  empty: {
    id: 'learningPaths.recommendedCourses.empty',
    defaultMessage: 'No recommendations yet. Enroll in a course to get suggestions.',
  },
};

const getRecommendationsUrl = () => (
  `${getConfig().LMS_BASE_URL.replace(/\/$/, '')}/api/course-recommendations/recommendations/?limit=${RECOMMENDED_COURSES_LIMIT}`
);

const transformRecommendation = course => ({
  courseId: course.course_id,
  courseOrg: course.org,
  courseName: course.display_name,
  courseNumber: course.number,
  courseImageUrl: course.image_url,
  courseStartDate: course.start,
  courseAdvertisedStart: course.start_display,
  linkUrl: course.about_url
    || `${getConfig().LMS_BASE_URL.replace(/\/$/, '')}/courses/${course.course_id}/about`,
});

const RecommendedCourses = () => {
  const { formatMessage } = useIntl();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getAuthenticatedHttpClient().get(getRecommendationsUrl())
      .then(({ data }) => {
        if (isMounted) {
          setCourses((data.results || []).map(transformRecommendation));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCourses([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="learning-path-recommended-courses" aria-labelledby="recommended-courses-heading">
      <div className="learning-path-recommended-courses__header">
        <h2 id="recommended-courses-heading">{formatMessage(messages.heading)}</h2>
      </div>

      {!isLoading && courses.length === 0 ? (
        <p role="status">{formatMessage(messages.empty)}</p>
      ) : (
        <CardGrid
          columnSizes={{
            xs: 12,
            md: 6,
            lg: 4,
            xl: 4,
          }}
        >
          {isLoading
            ? Array.from({ length: RECOMMENDED_COURSES_LIMIT }, (_, index) => (
              <RecommendedCourseCard key={`loading-${index}`} isLoading />
            ))
            : courses.map(course => (
              <RecommendedCourseCard key={course.courseId} {...course} />
            ))}
        </CardGrid>
      )}
    </section>
  );
};

export default RecommendedCourses;
