import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface SmartSelectInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export const SmartSelectInput = forwardRef<HTMLInputElement, SmartSelectInputProps>(
  ({ value, onChange, options, className, disabled, onKeyDown, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Expose the input element to parent ref (supporting focus, select, etc.)
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Normalize value on blur or selection
    const normalizeValue = (val: string) => {
      const match = options.find((opt) => opt.toLowerCase() === val.trim().toLowerCase());
      return match || val;
    };

    // Filtered options based on user input (only filter if user is actively typing)
    const filteredOptions = useMemo(() => {
      if (!isTyping) return options;
      const trimmed = value.trim().toLowerCase();
      if (!trimmed) return options;
      return options.filter((opt) => opt.toLowerCase().includes(trimmed));
    }, [options, value, isTyping]);

    // Handle outside clicks to close the dropdown
    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        const isClickInsideContainer = containerRef.current && containerRef.current.contains(e.target as Node);
        const isClickInsideDropdown = dropdownRef.current && dropdownRef.current.contains(e.target as Node);
        if (!isClickInsideContainer && !isClickInsideDropdown) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // When value changes, reset highlighted index
    useEffect(() => {
      setHighlightedIndex(-1);
    }, [value]);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const isHoveringDropdown = useRef(false);
    const [alignLeft, setAlignLeft] = useState(false);
    const [alignBottom, setAlignBottom] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; bottom: number }>({ top: 0, left: 0, bottom: 0 });
    const [maxHeight, setMaxHeight] = useState<number>(400);

    useEffect(() => {
      const updatePosition = () => {
        if (isOpen && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const dropdownWidth = 240; // width of w-60 is 15rem = 240px
          
          let showLeft = false;
          const spaceOnRight = window.innerWidth - rect.right;
          if (spaceOnRight < dropdownWidth && rect.left > dropdownWidth) {
            showLeft = true;
          }
          setAlignLeft(showLeft);

          const spaceBelow = window.innerHeight - rect.top - 16;
          const spaceAbove = rect.bottom - 16;

          // Open upwards if space below is less than 220px and there is more space above
          const showBottom = spaceBelow < 220 && spaceAbove > spaceBelow;
          setAlignBottom(showBottom);

          // Calculate viewport absolute placement coords for fixed position rendering
          const leftCoord = showLeft
            ? rect.left - dropdownWidth - 14
            : rect.right + 14;

          const topCoord = showBottom ? 0 : rect.top;
          const bottomCoord = showBottom ? window.innerHeight - rect.bottom : 0;
          const maxHt = showBottom ? spaceAbove : spaceBelow;

          setCoords({ top: topCoord, left: leftCoord, bottom: bottomCoord });
          setMaxHeight(maxHt);
        }
      };

      updatePosition();
      
      if (isOpen) {
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
      }
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }, [isOpen, filteredOptions]);

    const handleSelectOption = (opt: string) => {
      onChange(opt);
      setIsOpen(false);
      // Keep input focused
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Normalize the current text value (e.g. absent -> Absent)
      const normalized = normalizeValue(value);
      if (normalized !== value) {
        onChange(normalized);
      }
      
      // Delay closing dropdown slightly so click events on options have time to register (though onMouseDown is safer)
      setTimeout(() => {
        if (!containerRef.current?.contains(document.activeElement) && !isHoveringDropdown.current) {
          setIsOpen(false);
        }
      }, 100);
      
      props.onBlur?.(e);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === 'Enter') {
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelectOption(filteredOptions[highlightedIndex]);
          return;
        } else {
          // Normalize if exact case-insensitive match
          const normalized = normalizeValue(value);
          if (normalized !== value) {
            onChange(normalized);
          }
          setIsOpen(false);
        }
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        e.preventDefault();
        return;
      }

      // Propagate keydown to parent (to support navigation between input fields)
      onKeyDown?.(e);
    };

    return (
      <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[60]' : 'z-0'}`}>
        <input
          {...props}
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setIsTyping(true);
            onChange(e.target.value);
          }}
          onFocus={(e) => {
            setIsOpen(true);
            setIsTyping(false);
            props.onFocus?.(e);
          }}
          onClick={() => {
            setIsOpen(true);
            setIsTyping(false);
          }}
          onBlur={handleBlur}
          onKeyDown={handleInputKeyDown}
          className={`${className} cursor-text`}
          autoComplete="off"
        />
        
        {isOpen && !disabled && filteredOptions.length > 0 && (createPortal(
          <div
            ref={dropdownRef}
            onMouseEnter={() => { isHoveringDropdown.current = true; }}
            onMouseLeave={() => {
              isHoveringDropdown.current = false;
              if (!containerRef.current?.contains(document.activeElement)) {
                setIsOpen(false);
              }
            }}
            className="fixed z-[9999] w-60 overflow-y-auto rounded-lg border border-neutral-800 bg-[#1E1B18] text-white shadow-xl pointer-events-auto"
            style={{
              top: alignBottom ? 'auto' : `${coords.top}px`,
              bottom: alignBottom ? `${coords.bottom}px` : 'auto',
              left: `${coords.left}px`,
              maxHeight: `${maxHeight}px`,
            }}
          >
            {/* Popover Arrow */}
            {alignLeft ? (
              <div className={`absolute left-full w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#1E1B18] ${alignBottom ? 'bottom-2.5' : 'top-2.5'}`} />
            ) : (
              <div className={`absolute right-full w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-[#1E1B18] ${alignBottom ? 'bottom-2.5' : 'top-2.5'}`} />
            )}
            
            <ul className="py-1 px-1 space-y-0.5">
              {filteredOptions.map((opt, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = opt.toLowerCase() === value.trim().toLowerCase();
                return (
                  <li
                    key={opt}
                    onMouseDown={(e) => {
                      // Prevent input blur before selecting option
                      e.preventDefault();
                      handleSelectOption(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-2 py-1 cursor-pointer text-left text-[11px] md:text-[13px] leading-tight select-none transition-colors rounded-md
                      ${isHighlighted ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-300'}
                      ${isSelected && !isHighlighted ? 'bg-neutral-800/60 text-white font-bold' : ''}
                    `}
                  >
                    {opt}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        ) as any)}
      </div>
    );
  }
);

SmartSelectInput.displayName = 'SmartSelectInput';
