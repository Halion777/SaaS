// components/ui/Select.jsx - Shadcn style Select
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "../../utils/cn";
// Removed Button to avoid nested <button> inside the trigger button

const Select = React.forwardRef(({
    className,
    options = [],
    value,
    defaultValue,
    placeholder = "Select an option",
    multiple = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    clearable = false,
    loading = false,
    id,
    name,
    onChange,
    onValueChange,
    onOpenChange,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [keyboardFilter, setKeyboardFilter] = useState("");
    const keyboardFilterTimeoutRef = useRef(null);
    const selectRef = useRef(null);

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                setKeyboardFilter("");
                onOpenChange?.(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onOpenChange]);

    // Handle keyboard input for filtering when dropdown is open
    useEffect(() => {
        if (!isOpen) {
            setKeyboardFilter("");
            return;
        }

        const handleKeyDown = (event) => {
            // Only handle letter keys (a-z, A-Z)
            if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                
                // Clear existing timeout
                if (keyboardFilterTimeoutRef.current) {
                    clearTimeout(keyboardFilterTimeoutRef.current);
                }
                
                // Add character to filter
                const newFilter = keyboardFilter + event.key.toLowerCase();
                setKeyboardFilter(newFilter);
                
                // Reset filter after 1 second of no typing
                keyboardFilterTimeoutRef.current = setTimeout(() => {
                    setKeyboardFilter("");
                }, 1000);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (keyboardFilterTimeoutRef.current) {
                clearTimeout(keyboardFilterTimeoutRef.current);
            }
        };
    }, [isOpen, keyboardFilter]);

    // Get selected option(s) for display
    const getSelectedDisplay = () => {
        if (!value) return placeholder;

        if (multiple) {
            const selectedOptions = options.filter(opt => Array.isArray(value) && value.includes(opt.value));
            if (selectedOptions.length === 0) return placeholder;
            if (selectedOptions.length === 1) {
                const option = selectedOptions[0];
                return (
                    <span className="flex items-center gap-2">
                        {option.badgeColor && (
                            <span className={`w-2 h-2 rounded-full ${option.badgeColor}`}></span>
                        )}
                        {option.label}
                    </span>
                );
            }
            return `${selectedOptions.length} items selected`;
        }

        // Find exact match - compare as strings to avoid type issues
        const selectedOption = options.find(opt => String(opt.value) === String(value));
        if (!selectedOption) return placeholder;
        
        return (
            <span className="flex items-center gap-2">
                {selectedOption.badgeColor && (
                    <span className={`w-2 h-2 rounded-full ${selectedOption.badgeColor}`}></span>
                )}
                {selectedOption.label}
            </span>
        );
    };

    const handleToggle = () => {
        if (!disabled) {
            const newIsOpen = !isOpen;
            setIsOpen(newIsOpen);
            setKeyboardFilter(""); // Reset filter when toggling
            onOpenChange?.(newIsOpen);
        }
    };

    // Filter options based on keyboard input (country code filtering)
    const filteredOptions = React.useMemo(() => {
        if (!keyboardFilter) {
            return options;
        }
        
        return options.filter(option => {
            // Extract country code from label (format: "+92 PK")
            const labelParts = option.label.split(' ');
            const countryCode = labelParts[1] || ''; // e.g., "PK"
            
            // Match country code starting with keyboard filter (e.g., "b" -> "BE", "BR")
            const countryCodeLower = countryCode.toLowerCase();
            return countryCodeLower.startsWith(keyboardFilter);
        });
    }, [keyboardFilter, options]);

    const handleOptionSelect = (option) => {
        if (multiple) {
            const newValue = value || [];
            const updatedValue = newValue.includes(option.value)
                ? newValue.filter(v => v !== option.value)
                : [...newValue, option.value];
            
            // Support both onChange and onValueChange
            if (onValueChange) {
                onValueChange(updatedValue);
            } else {
            // Create a synthetic event object to mimic a native select
            const syntheticEvent = {
                target: {
                    name,
                    value: updatedValue
                }
            };
            onChange?.(syntheticEvent);
            }
        } else {
            // Support both onChange and onValueChange
            if (onValueChange) {
                onValueChange(option.value);
        } else {
            // Create a synthetic event object to mimic a native select
            const syntheticEvent = {
                target: {
                    name,
                    value: option.value
                }
            };
            onChange?.(syntheticEvent);
            }
            setIsOpen(false);
            setKeyboardFilter(""); // Reset filter when option is selected
            onOpenChange?.(false);
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onValueChange) {
            onValueChange(multiple ? [] : '');
        } else {
        onChange?.({ target: { name, value: multiple ? [] : '' } });
        }
    };

    const isSelected = (optionValue) => {
        if (!value) return false;
        if (multiple) {
            return Array.isArray(value) && value.includes(optionValue);
        }
        return String(value) === String(optionValue);
    };

    const hasValue = multiple ? value?.length > 0 : value !== undefined && value !== '';

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        error ? "text-destructive" : "text-foreground"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}

            <div className="relative" ref={selectRef} style={{ zIndex: isOpen ? 1000 : 'auto' }}>
                <button
                    ref={ref}
                    id={selectId}
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive focus:ring-destructive",
                        !hasValue && "text-muted-foreground/10"
                    )}
                    onClick={handleToggle}
                    onKeyDown={(e) => {
                        // Allow keyboard filtering when dropdown is open
                        if (isOpen && e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                            e.preventDefault();
                            e.stopPropagation();
                            const newFilter = keyboardFilter + e.key.toLowerCase();
                            setKeyboardFilter(newFilter);
                            // Reset filter after 1 second
                            if (keyboardFilterTimeoutRef.current) {
                                clearTimeout(keyboardFilterTimeoutRef.current);
                            }
                            keyboardFilterTimeoutRef.current = setTimeout(() => {
                                setKeyboardFilter("");
                            }, 1000);
                        } else if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggle();
                        }
                    }}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    {...props}
                >
                    <span className="truncate flex items-center gap-2">
                        {(() => {
                            if (!value) return placeholder;
                            
                            if (multiple) {
                                const selectedOptions = options.filter(opt => Array.isArray(value) && value.includes(opt.value));
                                if (selectedOptions.length === 0) return placeholder;
                                if (selectedOptions.length === 1) {
                                    const option = selectedOptions[0];
                                    return (
                                        <>
                                            {option.badgeColor && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${option.badgeColor}`}></span>}
                                            <span className="truncate">{option.label}</span>
                                        </>
                                    );
                                }
                                return `${selectedOptions.length} items selected`;
                            }
                            
                            const selectedOption = options.find(opt => String(opt.value) === String(value));
                            if (!selectedOption) return placeholder;
                            
                            return (
                                <>
                                    {selectedOption.badgeColor && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedOption.badgeColor}`}></span>}
                                    <span className="truncate">{selectedOption.label}</span>
                                </>
                            );
                        })()}
                    </span>

                    <div className="flex items-center gap-1">
                        {loading && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}

                        {clearable && hasValue && !loading && (
                            <span
                                role="button"
                                tabIndex={0}
                                aria-label="Clear selection"
                                onClick={handleClear}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClear(e); } }}
                                className="h-4 w-4 inline-flex items-center justify-center rounded hover:bg-muted cursor-pointer"
                            >
                                <X className="h-3 w-3" />
                            </span>
                        )}

                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </div>
                </button>

                {/* Hidden native select for form submission */}
                <select
                    name={name}
                    value={value || ''}
                    onChange={() => { }} // Controlled by our custom logic
                    className="sr-only"
                    tabIndex={-1}
                    multiple={multiple}
                    required={required}
                >
                    <option value="">Select...</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-[200px] overflow-auto" style={{ zIndex: 1001 }}>
                        <div className="py-1 max-h-60 overflow-y-auto overflow-x-hidden scrollbar-hide">
                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    {keyboardFilter ? `No country codes starting with "${keyboardFilter.toUpperCase()}"` : 'No options available'}
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                            isSelected(option.value) && "bg-accent text-accent-foreground",
                                            !isSelected(option.value) && "text-foreground",
                                            option.disabled && "pointer-events-none opacity-50"
                                        )}
                                        onClick={() => !option.disabled && handleOptionSelect(option)}
                                    >
                                        {option.icon && (
                                            <div className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${
                                                isSelected(option.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {typeof option.icon === 'string' ? (
                                                    <span className="material-icons text-sm">{option.icon}</span>
                                                ) : (
                                                    option.icon
                                                )}
                                            </div>
                                        )}
                                        {option.badgeColor && (
                                            <span className={`w-2 h-2 rounded-full mr-2 ${option.badgeColor}`}></span>
                                        )}
                                        <span className="flex-1">{option.label}</span>
                                        {multiple && isSelected(option.value) && (
                                            <Check className="h-4 w-4" />
                                        )}
                                        {option.description && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {option.description}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {description && !error && (
                <p className="text-sm text-muted-foreground mt-1">
                    {description}
                </p>
            )}

            {error && (
                <p className="text-sm text-destructive mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;