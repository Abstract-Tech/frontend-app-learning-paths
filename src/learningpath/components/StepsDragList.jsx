import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Form, IconButton, Icon } from '@openedx/paragon';
import { DragIndicator, Close } from '@openedx/paragon/icons';

const StepsDragList = ({
  steps, onReorder, onChangeWeight, onRemove,
}) => {
  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    const reordered = Array.from(steps);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  if (steps.length === 0) {
    return <p className="text-muted small">No courses added yet. Search above and add courses to this path.</p>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="learning-path-steps">
        {(droppableProvided) => (
          <ul
            className="list-unstyled steps-drag-list"
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
          >
            {steps.map((step, index) => (
              <Draggable key={step.courseKey} draggableId={step.courseKey} index={index}>
                {(draggableProvided, snapshot) => (
                  <li
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    className={`d-flex align-items-center border rounded p-2 mb-1 bg-white ${snapshot.isDragging ? 'shadow' : ''}`}
                  >
                    <span {...draggableProvided.dragHandleProps} className="mr-2 d-flex" aria-label="Drag to reorder">
                      <Icon src={DragIndicator} />
                    </span>
                    <div className="flex-grow-1">
                      <div className="font-weight-bold">{index + 1}. {step.name || step.courseKey}</div>
                      <div className="text-muted small">{step.courseKey}</div>
                    </div>
                    <Form.Group className="mb-0 mx-2" style={{ width: '90px' }}>
                      <Form.Control
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={step.weight}
                        aria-label={`Grading weight for ${step.courseKey}`}
                        onChange={(e) => onChangeWeight(step.courseKey, e.target.value)}
                      />
                    </Form.Group>
                    <IconButton
                      src={Close}
                      iconAs={Icon}
                      alt={`Remove ${step.courseKey}`}
                      onClick={() => onRemove(step.courseKey)}
                    />
                  </li>
                )}
              </Draggable>
            ))}
            {droppableProvided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
};

StepsDragList.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    courseKey: PropTypes.string.isRequired,
    name: PropTypes.string,
    weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })).isRequired,
  onReorder: PropTypes.func.isRequired,
  onChangeWeight: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default StepsDragList;
