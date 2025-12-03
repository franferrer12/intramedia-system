/**
 * Components Index - Central export point for all components
 *
 * Import components like:
 * import { Button, Card, Modal } from '@/components';
 */

// ========================================
// PHASE 1 - Basic Components
// ========================================

export { default as Button } from './Button';
export { default as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export { default as Badge, StatusBadge, CountBadge } from './Badge';
export { default as Layout } from './Layout';

// ========================================
// PHASE 2 - Form Components
// ========================================

export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Textarea } from './Textarea';

// ========================================
// PHASE 3 - Advanced Components
// ========================================

export { default as Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
export { default as Table, TableCell } from './Table';
export { default as Tabs, TabPanel, TabPanels } from './Tabs';
export {
  default as Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
  SkeletonGrid
} from './Skeleton';
export { default as Tooltip, TooltipButton, TooltipIcon } from './Tooltip';

// ========================================
// PHASE 4 - Additional Components
// ========================================

export { default as Alert, AlertTitle, AlertDescription, AlertActions } from './Alert';
export { default as Breadcrumbs, CustomBreadcrumbs, BreadcrumbsWithActions } from './Breadcrumbs';
export { default as Progress, CircularProgress, ProgressSteps } from './Progress';
export { default as Accordion, AccordionItem } from './Accordion';
export { default as Dropdown, DropdownItem, DropdownDivider } from './Dropdown';
export { default as PageTransition, FadeTransition, SlideTransition } from './PageTransition';

// ========================================
// Utilities
// ========================================

export { default as ExportButton } from './ExportButton';

// ========================================
// SPRINT 4.1.2 - Availability Management
// ========================================

export { default as DJAvailabilityCalendar } from './DJAvailabilityCalendar';
export { default as SmartSuggestionsPanel } from './SmartSuggestionsPanel';
export { default as CalendarViewSwitcher } from './CalendarViewSwitcher';
