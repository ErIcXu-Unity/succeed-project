import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoUpload from './VideoUpload';
import QuestionPreview from './QuestionPreview';
import { useAlert } from './CustomAlert';
import './TaskEditor.css';
import config from '../config';

const TaskEditor = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const alert = useAlert();
  const [task, setTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [taskIntroduction, setTaskIntroduction] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [publishAt, setPublishAt] = useState('');

  // Video info state (for saving video in create mode)
  const [pendingVideo, setPendingVideo] = useState(null);
  // Added: for syncing latest video in edit mode
  const [currentVideo, setCurrentVideo] = useState(null);

  // Debug: check taskId value
  console.log('TaskEditor Debug - taskId:', taskId, 'type:', typeof taskId);

  // Determine if in create mode (when taskId is 'new' or undefined, treat as create mode)
  const isCreateMode = taskId === 'new' || taskId === undefined;

  // Debug: check isCreateMode
  console.log('TaskEditor Debug - isCreateMode:', isCreateMode);

  // Current task ID (null in create mode, obtained after creation)
  const [currentTaskId, setCurrentTaskId] = useState(isCreateMode ? null : taskId);

  // Refresh questions when user returns from question creation
  useEffect(() => {
    const handleFocus = () => {
      if (!isCreateMode && (currentTaskId || taskId)) {
        console.log('Window focused, refreshing questions...');
        fetchExistingQuestions();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isCreateMode, currentTaskId, taskId]);

  // Initialize empty question template
  const createEmptyQuestion = () => ({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    difficulty: 'Easy',
    score: 5
  });

  useEffect(() => {
    console.log('TaskEditor useEffect - taskId:', taskId, 'isCreateMode:', isCreateMode);

    // Clear previous errors
    setError('');

    if (isCreateMode) {
      // Create mode: set loading to false directly
      console.log('TaskEditor - Create mode detected');
      setLoading(false);
    } else {
      // Edit mode: fetch task details
      console.log('TaskEditor - Edit mode detected, fetching task details');
      fetchTaskDetails();
    }
  }, [taskId, isCreateMode]);

  const fetchTaskDetails = async () => {
    console.log('fetchTaskDetails called with taskId:', taskId);

    if (!taskId || taskId === 'new') {
      console.warn('fetchTaskDetails - Invalid taskId for fetching:', taskId);
      setError('Invalid task ID for fetching details');
      setLoading(false);
      return;
    }

    try {
              const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`);
      console.log('fetchTaskDetails - Response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('fetchTaskDetails - Success:', data);
        setTask(data);
        setTaskName(data.name);
        setTaskIntroduction(data.introduction || '');

        // Handle publish_at field (for display in datetime-local input)
        if (data.publish_at) {
          const formatted = new Date(data.publish_at).toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
          setPublishAt(formatted);
        } else {
          setPublishAt('');
        }

        // Load existing question list
        await fetchExistingQuestions();

      } else {
        console.error('fetchTaskDetails - Failed:', response.status);
        setError('Failed to load task details');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      setError('Error loading task details');
    } finally {
      setLoading(false);
    }
  };

  // Get existing question list
  const fetchExistingQuestions = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/questions`);
      if (response.ok) {
        const questionsData = await response.json();
        console.log('Existing questions loaded:', questionsData);
        // Keep full question data, support all question types
        const formattedQuestions = questionsData.map(q => ({
          id: q.id,
          question: q.question,
          question_type: q.question_type || 'single_choice',
          question_data: q.question_data ? JSON.parse(q.question_data) : null,
          // Legacy single choice fields
          option_a: q.options?.A || q.option_a,
          option_b: q.options?.B || q.option_b,
          option_c: q.options?.C || q.option_c,
          option_d: q.options?.D || q.option_d,
          correct_answer: q.correct_answer || 'A',
          difficulty: q.difficulty || 'Easy',
          score: q.score || 5,
          description: q.description,
          image_url: q.image_url,
          video_type: q.video_type,
          video_url: q.video_url
        }));
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error('Error loading existing questions:', error);
    }
  };

  const addQuestion = (questionType = 'single_choice') => {
    if (questions.length < 100) {
      const taskIdForNavigation = currentTaskId || taskId;
      if (taskIdForNavigation && taskIdForNavigation !== 'new') {
        // Navigate to appropriate dedicated page based on question type
        const routeMap = {
          'single_choice': 'single-choice',
          'multiple_choice': 'multiple-choice',
          'fill_blank': 'fill-blank',
          'puzzle_game': 'puzzle-game',
          'matching_task': 'matching-task'
        };
        
        const route = routeMap[questionType] || 'single-choice';
        navigate(`/teacher/tasks/${taskIdForNavigation}/create/${route}`);
      } else {
        setError('Please save the task first before adding questions');
      }
    }
  };

  const removeQuestion = async (questionId) => {
    const confirmed = await alert.confirm('Are you sure you want to delete this question?');
    if (confirmed) {
      try {
        // If question has ID, it means it's already saved to database, need to call delete API
        if (questionId) {
          const response = await fetch(`${config.API_BASE_URL}/api/questions/${questionId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error('Deleting question failed');
          }
        }
        
        // Reload question list
        await fetchExistingQuestions();
        
      } catch (error) {
        console.error('Error deleting question：', error);
        alert.error('Failed to delete question, please try again');
      }
    }
  };

  // Questions are now created via dedicated pages
  // fetchExistingQuestions is called when returning from question creation pages

  // Save pending video
  const savePendingVideo = async (taskId, videoInfo) => {
    try {
      if (videoInfo.type === 'local') {
        // Local video needs to be re-uploaded (because there was no real taskId before)
        console.log('Local video needs to be re-uploaded with real taskId');
        // In this case, user needs to re-select file, so we skip for now
        // Actually, this is very complex, need to save file data
      } else if (videoInfo.type === 'youtube') {
        // YouTube link can be saved directly
        const response = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}/youtube`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ youtube_url: videoInfo.url }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to save YouTube video:', errorData);
        } else {
          console.log('YouTube video saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving pending video:', error);
    }
  };

  const saveTask = async () => {
    setSaving(true);
    setError('');

    try {
      let taskIdToUse = currentTaskId;

      if (isCreateMode) {
        // Create mode: first create task
        const createResponse = await fetch(`${config.API_BASE_URL}/api/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: taskName,
            introduction: taskIntroduction,
            publish_at: publishAt ? new Date(publishAt).toISOString() : null
          })
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create task');
        }

        const createData = await createResponse.json();
        taskIdToUse = createData.task.id;
        setCurrentTaskId(taskIdToUse);

        // Create mode: if there is pending video, save it now
        if (pendingVideo) {
          console.log('Saving pending video with taskId:', taskIdToUse);
          await savePendingVideo(taskIdToUse, pendingVideo);
        }

      } else {
        // Edit mode: update task information
        // Build update data, including existing video information
        const updateData = {
          name: taskName,
          introduction: taskIntroduction,
          publish_at: publishAt ? new Date(publishAt).toISOString() : null
        };

        // Use currentVideo (just uploaded/replaced video) first, otherwise use task
        if (currentVideo && currentVideo.type) {
          updateData.video_type = currentVideo.type;
          if (currentVideo.type === 'local' && currentVideo.path) {
            updateData.video_path = currentVideo.path;
            updateData.video_url = null;
          } else if (currentVideo.type === 'youtube' && currentVideo.url) {
            updateData.video_url = currentVideo.url;
            updateData.video_path = null;
          }
        } else if (task && (task.video_type || task.video_url || task.video_path)) {
          updateData.video_type = task.video_type;
          if (task.video_type === 'local' && task.video_path) {
            updateData.video_path = task.video_path;
          } else if (task.video_type === 'youtube' && task.video_url) {
            updateData.video_url = task.video_url;
          }
        }

        const updateResponse = await fetch(`${config.API_BASE_URL}/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update task');
        }

        // Update local task status, including returned video information
        const updateResult = await updateResponse.json();
        if (updateResult.task) {
          setTask(updateResult.task);
        }
      }

      // Batch create new questions (only create questions without ID)
      const newQuestions = questions.filter(q => !q.id);
      if (newQuestions.length > 0 && taskIdToUse) {
        const user = JSON.parse(localStorage.getItem('user_data'));
        const questionsResponse = await fetch(`${config.API_BASE_URL}/api/tasks/${taskIdToUse}/questions/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questions: newQuestions,
            created_by: user?.user_id
          })
        });

        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json();
          throw new Error(errorData.error || errorData.errors?.join(', ') || 'Failed to create questions');
        }
      }

      // Save success prompt
      alert.success(`✅ ${isCreateMode ? 'Task created successfully!' : 'Task updated successfully!'}`);
      
      // Delay jump, so user can see success information
      setTimeout(() => {
        // Navigate back and force a refresh by adding timestamp
        navigate('/teacher', { replace: true, state: { refresh: Date.now() } });
      }, 1000);

    } catch (error) {
      console.error('Error saving task:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    if (!taskName.trim()) {
      setError('Task name is required');
      return false;
    }

    if (!taskIntroduction.trim()) {
      setError('Task introduction is required');
      return false;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!(q.question || '').trim()) {
        setError(`Question ${i + 1}: Question text is required`);
        return false;
      }
      
      // Only validate options for single choice questions, other types of questions may not have these fields
      if (q.question_type === 'single_choice' || !q.question_type) {
        if (!(q.option_a || '').trim() || !(q.option_b || '').trim() || 
            !(q.option_c || '').trim() || !(q.option_d || '').trim()) {
          setError(`Question ${i + 1}: All options are required for single choice questions`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = () => {
    if (validateForm()) {
      saveTask();
    }
  };

  if (loading) {
    return (
      <div className="task-editor-container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i>
          Loading task details...
        </div>
      </div>
    );
  }

  if (error && !isCreateMode && !task) {
    return (
      <div className="task-editor-container">
        <div className="error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => navigate('/teacher')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-editor-container">
      <div className="task-editor-header">
        <button onClick={() => navigate('/teacher')} className="back-btn">
          <i className="fas fa-arrow-left"></i>
          Back to Dashboard
        </button>
        <h1>{isCreateMode ? 'Create New Task' : 'Edit Task'}</h1>
        <button onClick={handleSave} className="save-btn" disabled={saving}>
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              {isCreateMode ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              {isCreateMode ? 'Create Task' : 'Save Task'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
        </div>
      )}

      <div className="task-editor-content">
        {/* Task Basic Info */}
        <section className="task-info-section">
          <h2>Task Information</h2>
          <div className="form-group">
            <label htmlFor="taskName">Task Name</label>
            <input
              type="text"
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="taskIntroduction">Task Introduction</label>
            <textarea
              id="taskIntroduction"
              value={taskIntroduction}
              onChange={(e) => setTaskIntroduction(e.target.value)}
              placeholder="Enter detailed task introduction and storyline..."
              className="form-textarea"
              rows="8"
            />
          </div>

          {/* Only show Publish Schedule in edit mode */}
          {/* Only show Publish Schedule in edit mode */}
          {!isCreateMode && (
            <div className="publish-time-section">
              <div className="publish-time-header">
                <div className="publish-time-title">
                  <i className="fas fa-calendar-alt"></i>
                  <h3>Publish Schedule</h3>
                </div>
                <div className="publish-status">
                  {publishAt ? (
                    <span className="status-scheduled">
                      <i className="fas fa-clock"></i>
                      Scheduled
                    </span>
                  ) : (
                    <span className="status-immediate">
                      <i className="fas fa-eye"></i>
                      Immediate
                    </span>
                  )}
                </div>
              </div>
            
            <div className="publish-time-content">
              <div className="publish-options">
                <div className="publish-option">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="publishOption"
                      checked={!publishAt}
                      onChange={() => setPublishAt('')}
                    />
                    <span className="radio-custom"></span>
                    <div className="option-content">
                      <div className="option-title">
                        <i className="fas fa-bolt"></i>
                        Publish Immediately
                      </div>
                      <div className="option-description">
                        Students can access this task right after creation
                      </div>
                    </div>
                  </label>
                </div>
                
                <div className="publish-option">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="publishOption"
                      checked={!!publishAt}
                      onChange={() => {
                        if (!publishAt) {
                          // Set default to next hour
                          const now = new Date();
                          now.setHours(now.getHours() + 1);
                          now.setMinutes(0);
                          setPublishAt(now.toISOString().slice(0, 16));
                        }
                      }}
                    />
                    <span className="radio-custom"></span>
                    <div className="option-content">
                      <div className="option-title">
                        <i className="fas fa-calendar-check"></i>
                        Schedule for Later
                      </div>
                      <div className="option-description">
                        Set a specific date and time for publication
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              {publishAt && (
                <div className="datetime-picker-container">
                  <div className="datetime-picker-wrapper">
                    <div className="datetime-input-group">
                      <i className="fas fa-calendar"></i>
                      <input
                        type="datetime-local"
                        id="publishAt"
                        value={publishAt}
                        onChange={(e) => setPublishAt(e.target.value)}
                        className="datetime-input"
                        min={new Date().toISOString().slice(0, 16)}
                        lang="en-US"
                        data-locale="en-US"
                        placeholder="Select date and time"
                      />
                    </div>
                    <div className="quick-schedule-options">
                      <button
                        type="button"
                        className="quick-option-btn"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(9, 0, 0, 0);
                          setPublishAt(tomorrow.toISOString().slice(0, 16));
                        }}
                      >
                        Tomorrow 
                      </button>
                      <button
                        type="button"
                        className="quick-option-btn"
                        onClick={() => {
                          const nextWeek = new Date();
                          nextWeek.setDate(nextWeek.getDate() + 7);
                          nextWeek.setHours(9, 0, 0, 0);
                          setPublishAt(nextWeek.toISOString().slice(0, 16));
                        }}
                      >
                        Next Week 
                      </button>
                    </div>
                  </div>
                  {publishAt && (
                    <div className="schedule-preview">
                      <i className="fas fa-info-circle"></i>
                      <span>
                        Task will be published on{' '}
                        <strong>{new Date(publishAt).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}</strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Only show Task Video in edit mode */}
          {!isCreateMode && (
          <div className="form-group">
            <label>Task Video (Optional)</label>
            <VideoUpload 
              taskId={currentTaskId || taskId}
              onVideoUploaded={(result) => {
                console.log('Video uploaded:', result);
                
                // If in create mode, save video information for later processing
                if (isCreateMode && !currentTaskId) {
                  setPendingVideo(result);
                  console.log('Pending video saved for later:', result);
                } else {
                    // Edit mode: sync latest video to currentVideo
                  setCurrentVideo(result);
                }
              }}
            />
            <div className="help-text">
              Upload a video file or provide a YouTube link to help students understand the task better.
            </div>
          </div>
          )}
        </section>

        {/* Only show Questions section in edit mode */}
        {!isCreateMode && (
        <section className="questions-section">
          <div className="questions-header">
            <h2>Questions ({questions.length}/100)</h2>
            <div className="add-question-dropdown">
              <button
                onClick={() => addQuestion('single_choice')}
                className="btn btn-primary"
                disabled={questions.length >= 100}
              >
                <i className="fas fa-plus"></i>
                Add Question
              </button>
              {questions.length < 100 && (
                <div className="question-type-menu">
                  <button 
                    onClick={() => addQuestion('single_choice')}
                    className="question-type-option"
                  >
                    <i className="fas fa-dot-circle"></i>
                    <span>Single Choice</span>
                  </button>
                  <button 
                    onClick={() => addQuestion('multiple_choice')}
                    className="question-type-option"
                  >
                    <i className="fas fa-check-square"></i>
                    <span>Multiple Choice</span>
                  </button>
                  <button 
                    onClick={() => addQuestion('fill_blank')}
                    className="question-type-option"
                  >
                    <i className="fas fa-edit"></i>
                    <span>Fill in the Blank</span>
                  </button>
                  <button 
                    onClick={() => addQuestion('puzzle_game')}
                    className="question-type-option"
                  >
                    <i className="fas fa-puzzle-piece"></i>
                    <span>Puzzle Game</span>
                  </button>
                  <button 
                    onClick={() => addQuestion('matching_task')}
                    className="question-type-option"
                  >
                    <i className="fas fa-exchange-alt"></i>
                    <span>Matching Task</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="no-questions">
              <i className="fas fa-question-circle"></i>
              <p>No questions added yet. Click "Add Question" to create your first question.</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={question.id || index} className="question-card">
                  <div className="question-header">
                    <h3>Question {index + 1}</h3>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="remove-btn"
                      title="Remove question"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  <QuestionPreview question={question} />
                </div>
              ))}
            </div>
          )}
        </section>
        )}
      </div>
    </div>
  );
};

export default TaskEditor; 
