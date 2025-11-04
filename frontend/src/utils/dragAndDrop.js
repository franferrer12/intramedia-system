/**
 * Utilidades para Drag & Drop
 */

export const makeDraggable = (element, onDragEnd) => {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  element.addEventListener('mousedown', dragStart);
  element.addEventListener('mouseup', dragEnd);
  element.addEventListener('mousemove', drag);

  element.addEventListener('touchstart', dragStart);
  element.addEventListener('touchend', dragEnd);
  element.addEventListener('touchmove', drag);

  function dragStart(e) {
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === element) {
      isDragging = true;
      element.style.cursor = 'grabbing';
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;
    element.style.cursor = 'grab';

    if (onDragEnd) {
      onDragEnd({ x: currentX, y: currentY });
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, element);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }
};

/**
 * Drag & Drop para Calendario (Cambiar fecha de eventos)
 */
export class CalendarDragDrop {
  constructor(onEventMove) {
    this.onEventMove = onEventMove;
    this.draggedEvent = null;
  }

  handleDragStart(event, eventData) {
    this.draggedEvent = eventData;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.innerHTML);
    event.target.style.opacity = '0.5';
  }

  handleDragEnd(event) {
    event.target.style.opacity = '';
    this.draggedEvent = null;
  }

  handleDragOver(event) {
    if (event.preventDefault) {
      event.preventDefault();
    }
    event.dataTransfer.dropEffect = 'move';
    return false;
  }

  handleDrop(event, newDate) {
    if (event.stopPropagation) {
      event.stopPropagation();
    }

    if (this.draggedEvent && this.onEventMove) {
      this.onEventMove(this.draggedEvent, newDate);
    }

    return false;
  }
}

export default {
  makeDraggable,
  CalendarDragDrop
};
