import React, { createContext, useContext, useState, useCallback } from 'react';
import BookDemoModal from '../components/ui/BookDemoModal';

const BookDemoContext = createContext(null);

export function BookDemoProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openBookDemo = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeBookDemo = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <BookDemoContext.Provider value={{ isOpen, openBookDemo, closeBookDemo }}>
      {children}
      <BookDemoModal isOpen={isOpen} onClose={closeBookDemo} />
    </BookDemoContext.Provider>
  );
}

export function useBookDemo() {
  const ctx = useContext(BookDemoContext);
  if (!ctx) {
    return {
      isOpen: false,
      openBookDemo: () => {},
      closeBookDemo: () => {}
    };
  }
  return ctx;
}
