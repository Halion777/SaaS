import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';
import { cn } from '../../utils/cn';

const EnhancedSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Sélectionner une option",
  disabled = false,
  className,
  size = "default",
  variant = "default",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const optionsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            handleOptionSelect(options[highlightedIndex]);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, highlightedIndex, options]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const highlightedElement = optionsRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
    }
  };

  const handleOptionSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const selectedOption = options.find(opt => opt.value === value);

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    default: "h-10 px-3 text-sm",
    lg: "h-12 px-4 text-base"
  };

  const variantClasses = {
    default: "border-input bg-background text-foreground",
    outline: "border-border bg-transparent text-foreground",
    filled: "border-transparent bg-muted text-foreground"
  };

  return (
    <div className={cn("relative w-full", className)} ref={selectRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          isOpen && "ring-2 ring-ring ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
        {...props}
      >
        <span className={cn(
          "truncate",
          !selectedOption && "text-muted-foreground"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={cn(
            "ml-2 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="py-1" ref={optionsRef}>
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOptionSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                  highlightedIndex === index && "bg-accent text-accent-foreground",
                  value === option.value && "bg-primary text-primary-foreground",
                  value !== option.value && highlightedIndex !== index && "hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Icon name="Check" size={14} className="text-primary-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSelect; 