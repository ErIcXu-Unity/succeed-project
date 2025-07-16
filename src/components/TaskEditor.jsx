import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TaskEditor.css';

const TaskEditor = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [taskIntroduction, setTaskIntroduction] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [publishAt, setPublishAt] = useState('');

  // 调试：检查taskId的值
  console.log('TaskEditor Debug - taskId:', taskId, 'type:', typeof taskId);

  // 判断是否为新建模式 (taskId为'new'或undefined时都视为新建模式)
  const isCreateMode = taskId === 'new' || taskId === undefined;

  // 调试：检查isCreateMode
  console.log('TaskEditor Debug - isCreateMode:', isCreateMode);

  // 当前任务ID（新建模式下为null，创建后获得）
  const [currentTaskId, setCurrentTaskId] = useState(isCreateMode ? null : taskId);

  // 初始化空问题模板
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

    // 清除之前的错误
    setError('');

    if (isCreateMode) {
      // 新建模式：直接设置loading为false
      console.log('TaskEditor - Create mode detected');
      setLoading(false);
    } else {
      // 编辑模式：获取任务详情
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
              const response = await fetch(`http://localhost:5001/api/tasks/${taskId}`);
      console.log('fetchTaskDetails - Response:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('fetchTaskDetails - Success:', data);
        setTask(data);
        setTaskName(data.name);
        setTaskIntroduction(data.introduction || '');

        // 处理 publish_at 字段（用于显示到 datetime-local 输入框）
        if (data.publish_at) {
          const formatted = new Date(data.publish_at).toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
          setPublishAt(formatted);
        } else {
          setPublishAt('');
        }

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

  const addQuestion = () => {
    if (questions.length < 5) {
      setQuestions([...questions, createEmptyQuestion()]);
    }
  };

  const removeQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const saveTask = async () => {
    setSaving(true);
    setError('');

    try {
      let taskIdToUse = currentTaskId;

      if (isCreateMode) {
        // 新建模式：先创建任务
        const createResponse = await fetch('http://localhost:5001/api/tasks', {
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

      } else {
        // 编辑模式：更新任务信息
        const updateResponse = await fetch(`http://localhost:5001/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: taskName,
            introduction: taskIntroduction,
            publish_at: publishAt ? new Date(publishAt).toISOString() : null
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update task');
        }
      }

      // 批量创建问题（如果有）
      if (questions.length > 0 && taskIdToUse) {
        const user = JSON.parse(localStorage.getItem('user_data'));
        const questionsResponse = await fetch(`http://localhost:5001/api/tasks/${taskIdToUse}/questions/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questions: questions,
            created_by: user?.user_id
          })
        });

        if (!questionsResponse.ok) {
          const errorData = await questionsResponse.json();
          throw new Error(errorData.error || errorData.errors?.join(', ') || 'Failed to create questions');
        }
      }

      // 成功后返回teacher dashboard
      navigate('/teacher');

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

    // 验证问题
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Question text is required`);
        return false;
      }
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        setError(`Question ${i + 1}: All options are required`);
        return false;
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

          <div className="form-group">
            <label htmlFor="publishAt">Publish Time</label>
            <input
              type="datetime-local"
              id="publishAt"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="form-input"
            />
            <div className="help-text">
              Students will only see this task after this time. Leave blank to make it visible immediately.
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <section className="questions-section">
          <div className="questions-header">
            <h2>Questions ({questions.length}/5)</h2>
            <button
              onClick={addQuestion}
              className="btn btn-primary"
              disabled={questions.length >= 5}
            >
              <i className="fas fa-plus"></i>
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="no-questions">
              <i className="fas fa-question-circle"></i>
              <p>No questions added yet. Click "Add Question" to create your first question.</p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((question, index) => (
                <div key={index} className="question-card">
                  <div className="question-header">
                    <h3>Question {index + 1}</h3>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="remove-btn"
                      title="Remove question"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="Enter your question here..."
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="options-grid">
                    <div className="form-group">
                      <label>Option A</label>
                      <input
                        type="text"
                        value={question.option_a}
                        onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                        placeholder="Option A"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Option B</label>
                      <input
                        type="text"
                        value={question.option_b}
                        onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                        placeholder="Option B"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Option C</label>
                      <input
                        type="text"
                        value={question.option_c}
                        onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                        placeholder="Option C"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Option D</label>
                      <input
                        type="text"
                        value={question.option_d}
                        onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                        placeholder="Option D"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="question-settings">
                    <div className="form-group">
                      <label>Correct Answer</label>
                      <select
                        value={question.correct_answer}
                        onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                        className="form-select"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={question.difficulty}
                        onChange={(e) => updateQuestion(index, 'difficulty', e.target.value)}
                        className="form-select"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Points</label>
                      <input
                        type="number"
                        value={question.score}
                        onChange={(e) => updateQuestion(index, 'score', parseInt(e.target.value) || 0)}
                        min="1"
                        max="10"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TaskEditor; 