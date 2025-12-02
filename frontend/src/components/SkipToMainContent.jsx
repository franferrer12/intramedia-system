/**
 * Skip to Main Content Component
 * WCAG 2.1 - Keyboard Navigation
 */
export const SkipToMainContent = () => {
  return (
    <a
      href="#main-content"
      id="skip-to-main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md"
    >
      Saltar al contenido principal
    </a>
  );
};

export default SkipToMainContent;
