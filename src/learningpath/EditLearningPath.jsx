import React, { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Spinner, Icon } from '@openedx/paragon';
import { ChevronLeft } from '@openedx/paragon/icons';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import {
  useLearningPathDetail, useCoursesByIds, useUpdateLearningPath, useUpdateLearningPathImage,
} from './data/queries';
import LearningPathForm from './components/LearningPathForm';

const EditLearningPathPage = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const { administrator } = getAuthenticatedUser() || {};

  const { data: detail, isLoading, error } = useLearningPathDetail(key);
  const courseIds = useMemo(() => (detail?.steps || []).map((step) => step.courseKey), [detail]);
  const { data: coursesForPath, isLoading: loadingCourses } = useCoursesByIds(courseIds);

  const updateMutation = useUpdateLearningPath();
  const uploadImageMutation = useUpdateLearningPathImage();

  if (!administrator) {
    return <Navigate to="/" replace />;
  }

  if (isLoading || (courseIds.length > 0 && loadingCourses)) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-4">
        <p>Failed to load learning path.</p>
        <Link to="/" className="d-flex align-items-center back-link">
          <Icon src={ChevronLeft} />
          <span>Go Back</span>
        </Link>
      </div>
    );
  }

  const courseNameByKey = Object.fromEntries((coursesForPath || []).map((c) => [c.id, c.name]));
  const initialSteps = [...(detail.steps || [])]
    .sort((a, b) => a.order - b.order)
    .map((step) => ({
      courseKey: step.courseKey,
      name: courseNameByKey[step.courseKey] || step.courseKey,
      weight: step.weight,
    }));

  const handleSubmit = async (payload, imageFile) => {
    const { key: _unusedKey, ...updatePayload } = payload;
    await updateMutation.mutateAsync({ key, payload: updatePayload });
    if (imageFile) {
      await uploadImageMutation.mutateAsync({ key, file: imageFile });
    }
    navigate(`/learningpath/${key}`);
  };

  return (
    <LearningPathForm
      title="Edit Learning Path"
      keyEditable={false}
      fixedKey={key}
      submitLabel="Save Changes"
      submitting={updateMutation.isPending || uploadImageMutation.isPending}
      onSubmit={handleSubmit}
      initial={{
        displayName: detail.displayName,
        subtitle: detail.subtitle,
        description: detail.description,
        level: detail.level,
        duration: detail.duration,
        timeCommitment: detail.timeCommitment,
        sequential: detail.sequential,
        inviteOnly: detail.inviteOnly,
        steps: initialSteps,
        imageUrl: detail.image,
      }}
    />
  );
};

export default EditLearningPathPage;
