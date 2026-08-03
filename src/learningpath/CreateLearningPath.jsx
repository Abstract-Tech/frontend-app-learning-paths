import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { useCreateLearningPath, useUpdateLearningPathImage } from './data/queries';
import LearningPathForm from './components/LearningPathForm';

const CreateLearningPathPage = () => {
  const navigate = useNavigate();
  const { administrator } = getAuthenticatedUser() || {};
  const createMutation = useCreateLearningPath();
  const uploadImageMutation = useUpdateLearningPathImage();

  if (!administrator) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (payload, imageFile) => {
    const created = await createMutation.mutateAsync(payload);
    if (imageFile) {
      await uploadImageMutation.mutateAsync({ key: created.key, file: imageFile });
    }
    navigate(`/learningpath/${created.key}`);
  };

  return (
    <LearningPathForm
      title="Create Learning Path"
      keyEditable
      submitLabel="Create Learning Path"
      submitting={createMutation.isPending}
      onSubmit={handleSubmit}
    />
  );
};

export default CreateLearningPathPage;
