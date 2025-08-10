import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import './CustomAlert.css';

// Alert Context
const AlertContext = createContext();

// Alert type
export const ALERT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
  CONFIRM: 'confirm'
};

// Alert Provider
export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const lastAlertTime = useRef(0);

  const showAlert = useCallback(({
    title = '',
    message,
    type = ALERT_TYPES.INFO,
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm = null,
    onCancel = null,
    showCancel = false,
    autoClose = false,
    duration = 3000
  }) => {
    // Debounce: if called within 50ms, ignore
    const now = Date.now();
    if (now - lastAlertTime.current < 50) {
      return null;
    }
    lastAlertTime.current = now;

    const id = now + Math.random();
    
    const alert = {
      id,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      showCancel,
      autoClose,
      duration
    };

    setAlerts(prev => [...prev, alert]);

    // Auto-close
    if (autoClose) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }

    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const success = useCallback((message, options = {}) => {
    return showAlert({
      ...options,
      message,
      type: ALERT_TYPES.SUCCESS,
      autoClose: false
    });
  }, [showAlert]);

  const error = useCallback((message, options = {}) => {
    return showAlert({
      ...options,
      message,
      type: ALERT_TYPES.ERROR
    });
  }, [showAlert]);

  const info = useCallback((message, options = {}) => {
    return showAlert({
      ...options,
      message,
      type: ALERT_TYPES.INFO
    });
  }, [showAlert]);

  const warning = useCallback((message, options = {}) => {
    return showAlert({
      ...options,
      message,
      type: ALERT_TYPES.WARNING
    });
  }, [showAlert]);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      showAlert({
        ...options,
        message,
        type: ALERT_TYPES.CONFIRM,
        showCancel: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false)
      });
    });
  }, [showAlert]);

  const value = {
    showAlert,
    removeAlert,
    success,
    error,
    info,
    warning,
    confirm
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
    </AlertContext.Provider>
  );
};

// Alert Container - Optimized: only show latest alert, avoid performance issues caused by multiple alerts rendering at the same time
const AlertContainer = React.memo(({ alerts, removeAlert }) => {
  // Only show latest alert, improve performance
  const latestAlert = alerts[alerts.length - 1];
  
  if (!latestAlert) return null;

  return (
    <div className="alert-container">
      <AlertModal key={latestAlert.id} alert={latestAlert} onClose={() => removeAlert(latestAlert.id)} />
    </div>
  );
});

  // Alert Modal - Use React.memo to optimize performance
const AlertModal = React.memo(({ alert, onClose }) => {
  const handleConfirm = () => {
    if (alert.onConfirm) {
      alert.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (alert.onCancel) {
      alert.onCancel();
    }
    onClose();
  };

  const getIcon = () => {
    switch (alert.type) {
      case ALERT_TYPES.SUCCESS:
        return '✓';
      case ALERT_TYPES.ERROR:
        return '✕';
      case ALERT_TYPES.WARNING:
        return '⚠';
      case ALERT_TYPES.CONFIRM:
        return '?';
      default:
        return 'ℹ';
    }
  };

  const getIconClass = () => {
    switch (alert.type) {
      case ALERT_TYPES.SUCCESS:
        return 'success-icon';
      case ALERT_TYPES.ERROR:
        return 'error-icon';
      case ALERT_TYPES.WARNING:
        return 'warning-icon';
      case ALERT_TYPES.CONFIRM:
        return 'confirm-icon';
      default:
        return 'info-icon';
    }
  };

  return (
    <>
      <div className="alert-overlay" onClick={!alert.showCancel ? onClose : undefined} />
      <div className={`alert-modal ${alert.type}`}>
        <div className="alert-content">
          {alert.title && (
            <div className="alert-header">
              <div className={`alert-icon ${getIconClass()}`}>
                {getIcon()}
              </div>
              <h3 className="alert-title">{alert.title}</h3>
            </div>
          )}
          
          <div className="alert-body">
            {!alert.title && (
              <div className={`alert-icon ${getIconClass()}`}>
                {getIcon()}
              </div>
            )}
            <p className="alert-message">{alert.message}</p>
          </div>

          <div className="alert-actions">
            {alert.showCancel && (
              <button 
                className="alert-btn alert-btn-cancel"
                onClick={handleCancel}
              >
                {alert.cancelText}
              </button>
            )}
            <button 
              className="alert-btn alert-btn-confirm"
              onClick={handleConfirm}
            >
              {alert.confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

// Hook for using alerts
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertModal;