import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Copy Button Component
 * Provides one-click copy to clipboard with visual feedback
 */
const CopyButton = ({
  text,
  successMessage,
  className = '',
  size = 'md',
  showLabel = false,
  label = 'Copiar',
  variant = 'default',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text, successMessage);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variants = {
    default: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
    primary: 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    success: 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ${variants[variant]} ${className}`}
      aria-label={copied ? 'Copiado' : label}
      title={copied ? 'Copiado' : label}
    >
      {copied ? (
        <CheckIcon className={`${sizes[size]} text-green-500`} aria-hidden="true" />
      ) : (
        <ClipboardDocumentIcon className={sizes[size]} aria-hidden="true" />
      )}
      {showLabel && (
        <span className="ml-1.5 text-sm font-medium">
          {copied ? 'Copiado' : label}
        </span>
      )}
    </button>
  );
};

/**
 * Copy Text Component (displays text with copy button)
 */
export const CopyText = ({
  text,
  displayText,
  successMessage,
  className = '',
  truncate = false,
  maxLength = 40,
}) => {
  const display = displayText || text;
  const shouldTruncate = truncate && display.length > maxLength;
  const displayedText = shouldTruncate ? `${display.substring(0, maxLength)}...` : display;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <code
        className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
        title={shouldTruncate ? display : undefined}
      >
        {displayedText}
      </code>
      <CopyButton text={text} successMessage={successMessage} size="sm" />
    </div>
  );
};

/**
 * Copy Link Component (for URLs)
 */
export const CopyLink = ({ url, label, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        {label || url}
      </a>
      <CopyButton text={url} successMessage="Link copiado" size="sm" variant="primary" />
    </div>
  );
};

/**
 * Copy Card Component (for larger text blocks)
 */
export const CopyCard = ({ text, title, className = '' }) => {
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        {title && <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>}
        <CopyButton text={text} size="md" showLabel />
      </div>
      <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap break-all">
        {text}
      </pre>
    </div>
  );
};

export default CopyButton;
