import React from 'react';

const ErrorSpottingEditor = ({ formData, setFormData }) => {
  const handleAddErrorSpot = () => {
    const description = prompt("Describe this error:");
    if (description) {
      // For now, use placeholder coordinates. In a real implementation,
      // this would be integrated with an image click handler
      const x = Math.floor(Math.random() * 400) + 50;
      const y = Math.floor(Math.random() * 300) + 50;
      setFormData(prev => ({ 
        ...prev, 
        error_spots: [...prev.error_spots, { x, y, description }]
      }));
    }
  };

  const handleRemoveErrorSpot = (index) => {
    const newSpots = formData.error_spots.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, error_spots: newSpots }));
  };

  const handleErrorSpotChange = (index, field, value) => {
    const newSpots = [...formData.error_spots];
    newSpots[index] = { ...newSpots[index], [field]: value };
    setFormData(prev => ({ ...prev, error_spots: newSpots }));
  };

  return (
    <div className="form-card">
      <div className="card-header">
        <i className="fas fa-search"></i>
        <h3>Error Spotting Setup</h3>
        <span className="card-subtitle">Mark error locations on image</span>
      </div>
      
      <div className="error-spotting-options">
        <div className="form-group-redesigned">
          <label>Instructions:</label>
          <ol>
            <li>Upload an image with errors in the Media Content section</li>
            <li>Add error spots below with descriptions</li>
            <li>Students will click on the incorrect areas in the image</li>
          </ol>
        </div>
        
        <div className="error-spots-list">
          <h4>Error Spots</h4>
          {formData.error_spots.length === 0 ? (
            <p className="no-errors">No error spots defined yet. Add error locations below.</p>
          ) : (
            <div className="error-spots-container">
              {formData.error_spots.map((spot, index) => (
                <div key={index} className="error-spot-item">
                  <div className="error-spot-header">
                    <h5>Error {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => handleRemoveErrorSpot(index)}
                      className="remove-error-btn"
                      title="Remove this error spot"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  
                  <div className="error-spot-fields">
                    <div className="coordinate-inputs">
                      <label>X Position:</label>
                      <input
                        type="number"
                        value={spot.x}
                        onChange={(e) => handleErrorSpotChange(index, 'x', parseInt(e.target.value))}
                        placeholder="X coordinate"
                        min="0"
                        required
                      />
                      <label>Y Position:</label>
                      <input
                        type="number"
                        value={spot.y}
                        onChange={(e) => handleErrorSpotChange(index, 'y', parseInt(e.target.value))}
                        placeholder="Y coordinate"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div className="description-input">
                      <label>Error Description:</label>
                      <input
                        type="text"
                        value={spot.description}
                        onChange={(e) => handleErrorSpotChange(index, 'description', e.target.value)}
                        placeholder="Describe what's wrong in this area"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            type="button"
            onClick={handleAddErrorSpot}
            className="add-error-btn"
          >
            <i className="fas fa-plus"></i>
            Add Error Spot
          </button>
        </div>
        
        <div className="error-spotting-help">
          <h4>Tips for Error Spotting Questions:</h4>
          <ul>
            <li>Use clear, high-quality images</li>
            <li>Make errors obvious but not too easy to spot</li>
            <li>Provide clear descriptions for each error</li>
            <li>Test your coordinates to ensure they point to the right areas</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorSpottingEditor;