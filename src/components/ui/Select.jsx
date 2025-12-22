// components/ui/Select.jsx - Shadcn style Select
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
    searchable, // Extract searchable to prevent it from being passed to DOM
    usePortal = false, // Use portal to render dropdown outside of parent overflow containers
    maxHeight, // Optional max height override for dropdown
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [keyboardFilter, setKeyboardFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState(""); // For visible search input
    const keyboardFilterTimeoutRef = useRef(null);
    const selectRef = useRef(null);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [openUpward, setOpenUpward] = useState(false);

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside both the select trigger and the dropdown (portal)
            const isClickInSelect = selectRef.current && selectRef.current.contains(event.target);
            const isClickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
            
            if (!isClickInSelect && !isClickInDropdown) {
                setIsOpen(false);
                setKeyboardFilter("");
                onOpenChange?.(false);
            }
        };

        if (isOpen) {
            // Use a small delay to ensure the dropdown is rendered before checking clicks
            const timeoutId = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
            
            return () => {
                clearTimeout(timeoutId);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onOpenChange]);

    // Calculate dropdown position for portal mode
    useEffect(() => {
        if (usePortal && isOpen && selectRef.current) {
            const updatePosition = () => {
                if (!selectRef.current) return;
                const rect = selectRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const dropdownHeight = maxHeight && maxHeight !== 'none' ? (typeof maxHeight === 'string' ? parseInt(maxHeight) : maxHeight) : 200; // Use maxHeight prop or default to 200px
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                // Open upward if:
                // 1. We're in the last 2 rows (less than 150px from bottom) - always open upward
                // 2. There's not enough space below (< dropdownHeight) and more space above
                const isLastTwoRows = spaceBelow < 150;
                const shouldOpenUpward = isLastTwoRows || (spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
                
                setOpenUpward(shouldOpenUpward);
                setDropdownPosition({
                    top: shouldOpenUpward ? rect.top : rect.bottom,
                    left: rect.left,
                    width: rect.width
                });
            };
            
            updatePosition();
            
            // Find all scrollable parent containers
            const scrollableParents = [];
            let parent = selectRef.current.parentElement;
            while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent);
                if (style.overflow === 'auto' || style.overflow === 'scroll' || 
                    style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                    style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    scrollableParents.push(parent);
                }
                parent = parent.parentElement;
            }
            
            // Update position on scroll (handles scrollable containers)
            const handleScroll = () => {
                requestAnimationFrame(updatePosition);
            };
            
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updatePosition);
            scrollableParents.forEach(parent => {
                parent.addEventListener('scroll', handleScroll, true);
            });
            
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', updatePosition);
                scrollableParents.forEach(parent => {
                    parent.removeEventListener('scroll', handleScroll, true);
                });
            };
        }
    }, [isOpen, usePortal]);

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
            setSearchQuery(""); // Reset search query when toggling
            onOpenChange?.(newIsOpen);
            // Focus search input when opening if searchable
            if (newIsOpen && searchable && searchInputRef.current) {
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 100);
            }
        }
    };

    // Filter options based on keyboard input or search query
    const filteredOptions = React.useMemo(() => {
        const filter = searchable ? searchQuery.toLowerCase() : keyboardFilter.toLowerCase();
        
        if (!filter) {
            return options;
        }
        
        return options.filter(option => {
            const labelLower = option.label.toLowerCase();
            
            // Try to extract country code from different label formats:
            // Format 1: "BE - Belgium" (country code - country name)
            // Format 2: "+92 PK" (phone code + country code)
            // Format 3: Direct country code match
            
            // Check if label contains " - " (country code - country name format)
            if (labelLower.includes(' - ')) {
                const parts = option.label.split(' - ');
                const countryCode = parts[0] || ''; // e.g., "BE"
                if (countryCode.toLowerCase().includes(filter)) {
                    return true;
                }
                // Also check country name
                const countryName = parts[1] || '';
                if (countryName.toLowerCase().includes(filter)) {
                    return true;
                }
            }
            
            // Check if label contains space (phone code + country code format)
            const labelParts = option.label.split(' ');
            if (labelParts.length >= 2) {
                // Try phone code (format: "+92 PK")
                const phoneCode = labelParts[0] || '';
                if (phoneCode.toLowerCase().includes(filter)) {
                    return true;
                }
                // Try country code
                const countryCode = labelParts[1] || '';
                if (countryCode.toLowerCase().includes(filter)) {
                    return true;
                }
            }
            
            // Fallback: match against entire label
            return labelLower.includes(filter);
        });
    }, [keyboardFilter, searchQuery, searchable, options]);

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
            setSearchQuery(""); // Reset search query when option is selected
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
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative" ref={selectRef} style={{ zIndex: isOpen ? 1000 : 'auto' }}>
                <button
                    ref={ref}
                    id={selectId}
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-border text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        // Only apply default background if no gradient is provided
                        !className?.includes('bg-gradient-to-r') && "bg-background border-border",
                        error && "border-destructive focus:ring-destructive",
                        !hasValue && "text-muted-foreground/10",
                        // Check if className contains gradient (badge style) and override default styles
                        className?.includes('bg-gradient-to-r') && "h-auto py-1.5 px-3 min-w-[100px]",
                        // Merge custom className for badge styling (must come last to override defaults)
                        className
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
                    <span className={cn(
                        "truncate flex items-center gap-2",
                        className?.includes('bg-gradient-to-r') && "w-full justify-center"
                    )}>
                        {(() => {
                            if (!value) return placeholder;
                            
                            if (multiple) {
                                const selectedOptions = options.filter(opt => Array.isArray(value) && value.includes(opt.value));
                                if (selectedOptions.length === 0) return placeholder;
                                if (selectedOptions.length === 1) {
                                    const option = selectedOptions[0];
                                    // If badge style, don't show dot, just show label
                                    if (className?.includes('bg-gradient-to-r')) {
                                        return <span className="truncate font-semibold text-xs">{option.label}</span>;
                                    }
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
                            
                            // If badge style, don't show dot, just show label
                            if (className?.includes('bg-gradient-to-r')) {
                                return <span className="truncate font-semibold text-xs">{selectedOption.label}</span>;
                            }
                            
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
                {isOpen && (() => {
                    // Only render if we have valid position (or not using portal)
                    if (usePortal && (!dropdownPosition.width || dropdownPosition.width === 0)) {
                        return null;
                    }
                    
                    const dropdownContent = (
                        <div 
                            ref={dropdownRef}
                            className={cn(
                                "bg-popover text-popover-foreground border border-border rounded-md shadow-lg overflow-hidden",
                                !maxHeight && "max-h-[200px]",
                                usePortal ? "fixed" : "absolute w-full"
                            )}
                            style={{
                                ...(maxHeight && maxHeight !== 'none' ? { maxHeight: typeof maxHeight === 'string' ? maxHeight : `${maxHeight}px` } : {}),
                                ...(usePortal ? { 
                                    zIndex: 99999, 
                                    top: `${dropdownPosition.top}px`, 
                                    left: `${dropdownPosition.left}px`, 
                                    width: `${dropdownPosition.width}px`,
                                    marginTop: openUpward ? '0px' : '1px',
                                    marginBottom: openUpward ? '0px' : '0px',
                                    position: 'fixed',
                                    transform: openUpward ? 'translateY(-100%)' : 'none'
                                } : { 
                                    zIndex: 1001,
                                    bottom: openUpward ? '100%' : 'auto',
                                    top: openUpward ? 'auto' : '100%',
                                    marginTop: openUpward ? '0px' : '1px',
                                    marginBottom: openUpward ? '0px' : '0px'
                                })
                            }}
                        >
                            {/* Search input for searchable selects */}
                            {searchable && (
                                <div className="p-2 border-b border-border sticky top-0 bg-popover z-10">
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search country code..."
                                        className="w-full h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => {
                                            // Prevent closing dropdown on Enter
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            <div className={cn("py-1 overflow-y-auto overflow-x-hidden scrollbar-hide", !maxHeight && "max-h-60")} style={maxHeight && maxHeight !== 'none' ? { maxHeight: typeof maxHeight === 'string' ? maxHeight : `${maxHeight}px` } : undefined}>
                                {filteredOptions.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">
                                        {searchable && searchQuery ? `No results for "${searchQuery}"` : keyboardFilter ? `No country codes starting with "${keyboardFilter.toUpperCase()}"` : 'No options available'}
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
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!option.disabled) {
                                                    handleOptionSelect(option);
                                                }
                                            }}
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
                    );
                    
                    return usePortal ? createPortal(dropdownContent, document.body) : dropdownContent;
                })()}
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