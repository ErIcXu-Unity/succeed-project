import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Whiteboard from './Whiteboard';
import Toolbar from './Toolbar';
import FeedbackPopup from './FeedbackPopup';
import './EscapeRoomEditor.css';

const EscapeRoomEditor = () => {
  const [slidesData, setSlidesData] = useState([{
    blocks: [],
    bg: '#ffffff',
    fg: '#000000',
    fs: '16'
  }]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditable, setIsEditable] = useState(true);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [lastCorrect, setLastCorrect] = useState(false);

  const currentSlide = slidesData[currentSlideIndex];

  const updateSlide = (index, updates) => {
    setSlidesData(prev => prev.map((slide, i) => 
      i === index ? { ...slide, ...updates } : slide
    ));
  };

  const addSlide = () => {
    const newSlide = {
      blocks: [],
      bg: '#ffffff',
      fg: '#000000',
      fs: '16'
    };
    setSlidesData(prev => [...prev, newSlide]);
    setCurrentSlideIndex(slidesData.length);
  };

  const switchSlide = (index) => {
    setCurrentSlideIndex(index);
  };

  const addContent = (type) => {
    const newBlock = { type };
    
    if (type === 'text') {
      newBlock.content = '';
    } else if (type === 'mcq') {
      newBlock.question = '';
      newBlock.options = ['', '', ''];
    } else if (type === 'video') {
      newBlock.url = '';
    } else if (type === 'image') {
      newBlock.url = '';
    }

    updateSlide(currentSlideIndex, {
      blocks: [...currentSlide.blocks, newBlock]
    });
  };

  const removeContent = (blockIndex) => {
    const updatedBlocks = currentSlide.blocks.filter((_, i) => i !== blockIndex);
    updateSlide(currentSlideIndex, { blocks: updatedBlocks });
  };

  const updateContent = (blockIndex, updates) => {
    const updatedBlocks = currentSlide.blocks.map((block, i) =>
      i === blockIndex ? { ...block, ...updates } : block
    );
    updateSlide(currentSlideIndex, { blocks: updatedBlocks });
  };

  const saveProgress = () => {
    setIsEditable(false);
    alert('Saved and locked!');
  };

  const toggleEdit = () => {
    setIsEditable(true);
  };

  const submitAnswer = () => {
    const isCorrect = Math.random() < 0.5;
    setLastCorrect(isCorrect);
    setFeedbackText(isCorrect ? '✔ Correct!' : '✘ Try Again.');
    setFeedbackVisible(true);
  };

  const closeFeedback = () => {
    setFeedbackVisible(false);
    if (lastCorrect && currentSlideIndex < slidesData.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  // Handle mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (e) => {
      if (feedbackVisible) return;

      if (e.deltaY > 0 && currentSlideIndex < slidesData.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
      } else if (e.deltaY < 0 && currentSlideIndex > 0) {
        setCurrentSlideIndex(prev => prev - 1);
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: true });
    return () => document.removeEventListener('wheel', handleWheel);
  }, [currentSlideIndex, slidesData.length, feedbackVisible]);

  return (
    <div className="escape-room-editor">
      <div className="topbar">
        <span>Escape-Room Editor</span>
        <a href="/">Log out</a>
      </div>

      <div className="layout">
        <Sidebar
          slidesData={slidesData}
          currentSlideIndex={currentSlideIndex}
          onSlideSwitch={switchSlide}
          onAddSlide={addSlide}
        />

        <Whiteboard
          slide={currentSlide}
          isEditable={isEditable}
          onRemoveContent={removeContent}
          onUpdateContent={updateContent}
          onSave={saveProgress}
          onToggleEdit={toggleEdit}
          onSubmitAnswer={submitAnswer}
        />

        <Toolbar
          slide={currentSlide}
          onUpdateSlide={(updates) => updateSlide(currentSlideIndex, updates)}
          onAddContent={addContent}
        />
      </div>

      <FeedbackPopup
        visible={feedbackVisible}
        text={feedbackText}
        onClose={closeFeedback}
      />
    </div>
  );
};

export default EscapeRoomEditor;