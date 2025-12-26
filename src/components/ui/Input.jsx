import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../utils/cn";
import { isValidEmail, validateNumberInput, limitNumberLength } from "../../utils/validation";

const Input = React.forwardRef(({
    className,
    type = "text",
    label,
    description,
    error,
    required = false,
    id,
    value,
    onChange,
    min,
    max,
    maxLength,
    ...props
}, ref) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Internal ref for date picker
    const internalRef = useRef(null);
    
    // Callback ref to handle both forwarded ref and internal ref
    const inputRef = (node) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    };
    
    // Internal state for email validation
    const [emailError, setEmailError] = useState('');
    const [internalValue, setInternalValue] = useState(value || '');

    // Sync internal value with external value
    useEffect(() => {
        setInternalValue(value || '');
    }, [value]);

    // Base input classes
    const baseInputClasses = "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    // Get default maxLength based on input type if not provided
    const getDefaultMaxLength = () => {
        if (maxLength !== undefined) return maxLength;
        
        // Set reasonable defaults for different input types
        switch (type) {
            case "number":
            case "tel":
                return 15; // Numbers: 15 digits
            case "email":
                return 254; // Email: RFC 5321 standard max length
            case "password":
                return 128; // Password: reasonable security limit
            case "text":
            case "search":
            case "url":
            default:
                return 500; // Text inputs: 500 characters (reasonable for most fields)
        }
    };

    // Handle input changes with validation
    const handleChange = (e) => {
        let newValue = e.target.value;
        const defaultMaxLength = getDefaultMaxLength();

        // Number input validation (apply number-specific limits first)
        if (type === "number" || type === "tel") {
            // Remove any minus signs, plus signs, or 'e'/'E' characters (scientific notation)
            newValue = newValue.replace(/[eE\+\-]/g, '');
            
            // Limit length first (default 15 digits for numbers)
            const numberMaxLength = maxLength || 15;
            newValue = limitNumberLength(newValue, numberMaxLength);
            
            // Validate and prevent negative numbers
            const validatedValue = validateNumberInput(
                newValue,
                true, // allow decimals
                min !== undefined ? parseFloat(min) : 0, // min value (default 0 to prevent negative)
                max !== undefined ? parseFloat(max) : null // max value
            );
            
            newValue = validatedValue;
        } else {
            // Apply maxLength limit for non-number input types
            if (newValue.length > defaultMaxLength) {
                newValue = newValue.slice(0, defaultMaxLength);
            }
        }

        // Email input validation
        if (type === "email") {
            // Real-time email validation
            if (newValue && newValue.trim() !== '') {
                if (!isValidEmail(newValue)) {
                    setEmailError('Please enter a valid email address (e.g., name@example.com)');
                } else {
                    setEmailError('');
                }
            } else {
                setEmailError('');
            }
        }

        // Update internal value
        setInternalValue(newValue);

        // Call original onChange if provided
        if (onChange) {
            // Create a synthetic event with the validated value
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    value: newValue
                }
            };
            onChange(syntheticEvent);
        }
    };

    // Handle keydown to prevent invalid characters for number inputs
    const handleKeyDown = (e) => {
        // For number inputs, prevent typing minus, plus, 'e', 'E'
        if (type === "number" || type === "tel") {
            // Allow: numbers, decimal point, backspace, delete, tab, arrow keys, etc.
            const allowedKeys = [
                'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Home', 'End'
            ];
            
            // Allow Ctrl/Cmd + A, C, V, X (select all, copy, paste, cut)
            if (e.ctrlKey || e.metaKey) {
                if (['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    return; // Allow these
                }
            }
            
            // Check if key is allowed
            if (allowedKeys.includes(e.key)) {
                return; // Allow these keys
            }
            
            // Check if it's a number or decimal point
            if (/[0-9.]/.test(e.key)) {
                // If it's a decimal point, check if one already exists
                if (e.key === '.' && internalValue.includes('.')) {
                    e.preventDefault();
                    return;
                }
                return; // Allow numbers and decimal point
            }
            
            // Prevent all other keys (including minus, plus, 'e', 'E')
            e.preventDefault();
        }
    };

    // Handle click on date input to open date picker
    const handleDateClick = (e) => {
        if (type === "date" || type === "datetime-local" || type === "time" || type === "month" || type === "week") {
            // Get the input element
            const inputElement = internalRef.current || e.target;
            
            // Try to use showPicker() API (modern browsers)
            if (inputElement && typeof inputElement.showPicker === 'function') {
                try {
                    inputElement.showPicker();
                } catch (err) {
                    // Fallback: focus the input (should open picker on mobile/older browsers)
                    inputElement.focus();
                }
            } else {
                // Fallback: focus the input (should open picker on mobile/older browsers)
                inputElement.focus();
            }
        }
    };

    // Determine the final error to display
    const finalError = error || emailError;

    // Checkbox-specific styles
    if (type === "checkbox") {
        return (
            <input
                type="checkbox"
                className={cn(
                    "h-4 w-4 rounded border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                id={inputId}
                {...props}
            />
        );
    }

    // Radio button-specific styles
    if (type === "radio") {
        return (
            <input
                type="radio"
                className={cn(
                    "h-4 w-4 rounded-full border border-input bg-background text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                id={inputId}
                {...props}
            />
        );
    }

    // For regular inputs with wrapper structure
    return (
        <div className="space-y-2">
            {label && (
                <label
                    htmlFor={inputId}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        finalError ? "text-destructive" : "text-foreground"
                    )}
                >
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <input
                type={type}
                value={internalValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={type === "date" || type === "datetime-local" || type === "time" || type === "month" || type === "week" ? handleDateClick : undefined}
                className={cn(
                    baseInputClasses,
                    finalError && "border-destructive focus-visible:ring-destructive",
                    (type === "date" || type === "datetime-local" || type === "time" || type === "month" || type === "week") && "cursor-pointer",
                    className
                )}
                ref={inputRef}
                id={inputId}
                min={type === "number" ? (min !== undefined ? min : 0) : undefined}
                max={type === "number" ? max : undefined}
                maxLength={getDefaultMaxLength()}
                {...props}
            />

            {description && !finalError && (
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}

            {finalError && (
                <p className="text-sm text-destructive">
                    {finalError}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;