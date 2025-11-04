import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

/**
 * Componente de Edición Inline
 * Permite editar valores directamente en tablas o cards
 */
const InlineEdit = ({
  value,
  onSave,
  type = 'text',
  className = '',
  displayComponent,
  required = false,
  multiline = false,
  options = [] // Para select
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text') {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (required && !editValue) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      setEditValue(value); // Revertir
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`group inline-flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors ${className}`}
        onClick={() => setIsEditing(true)}
      >
        {displayComponent ? (
          displayComponent(value)
        ) : (
          <span className="dark:text-gray-200">{value || '-'}</span>
        )}
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {type === 'select' ? (
        <select
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input input-sm flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          disabled={isSaving}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          rows={3}
          disabled={isSaving}
        />
      ) : (
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input input-sm flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          required={required}
          disabled={isSaving}
        />
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        <Check className="w-4 h-4" />
      </button>

      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default InlineEdit;
