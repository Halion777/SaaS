import React, { useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const RichTextEditor = ({ value, onChange, placeholder = 'Enter content...', className = '' }) => {
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const executeCommand = (command, value = null) => {
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Check if a format is currently active
  const isFormatActive = (command, value = null) => {
    try {
      return document.queryCommandState(command);
    } catch (e) {
      return false;
    }
  };

  // Get the current block element tag name
  const getCurrentBlockTag = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    let node = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName?.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div'].includes(tagName)) {
          return tagName;
        }
      }
      node = node.parentNode;
    }
    return 'p'; // Default to paragraph
  };

  // Toggle format command (apply if not active, remove if active)
  const toggleFormat = (command, value = null) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Ensure we have a selection
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      // If no selection, select all text in the current block
      const range = document.createRange();
      const currentBlock = getCurrentBlockElement();
      if (currentBlock) {
        range.selectNodeContents(currentBlock);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    if (command === 'bold' || command === 'italic' || command === 'underline' || command === 'strikeThrough') {
      // For inline formats, use queryCommandState to check if active
      const isActive = isFormatActive(command);
      // Toggle the format
      document.execCommand(command, false, null);
    } else if (command === 'formatBlock') {
      // For block formats (headings, paragraphs)
      const currentTag = getCurrentBlockTag();
      if (currentTag === value) {
        // Already this format, convert to paragraph to "undo" it
        document.execCommand('formatBlock', false, 'p');
      } else {
        // Apply the new format (this will override current format)
        document.execCommand('formatBlock', false, value);
      }
    } else {
      // For other commands, just execute
      document.execCommand(command, false, value);
    }
    
    handleContentChange();
  };

  // Get the current block element
  const getCurrentBlockElement = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    
    let node = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName?.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'li'].includes(tagName)) {
          return node;
        }
      }
      node = node.parentNode;
    }
    return editorRef.current;
  };

  // Clear all formatting
  const clearFormatting = () => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    const selection = window.getSelection();
    
    // Ensure we have a selection
    if (!selection.rangeCount || selection.isCollapsed) {
      // If no selection, select all text in the current block
      const currentBlock = getCurrentBlockElement();
      if (currentBlock) {
        const range = document.createRange();
        range.selectNodeContents(currentBlock);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    
    // Remove all formatting - use removeFormat which removes inline styles
    document.execCommand('removeFormat', false, null);
    
    // Remove specific inline formats by toggling them off if they're active
    // We need to check state first to avoid toggling them ON
    ['bold', 'italic', 'underline', 'strikeThrough'].forEach(format => {
      // Check if format is active, and if so, toggle it off
      try {
        if (document.queryCommandState(format)) {
          document.execCommand(format, false, null);
        }
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Convert current block to paragraph if it's a heading
    const currentTag = getCurrentBlockTag();
    if (currentTag && currentTag !== 'p' && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(currentTag)) {
      document.execCommand('formatBlock', false, 'p');
    }
    
    handleContentChange();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    handleContentChange();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const insertUnorderedList = () => {
    executeCommand('insertUnorderedList');
  };

  const insertOrderedList = () => {
    executeCommand('insertOrderedList');
  };

  return (
    <div className={`border border-border rounded-lg bg-background ${className}`}>
      {/* Toolbar */}
      <div 
        ref={toolbarRef}
        className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-gray-50 rounded-t-lg"
      >
        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => toggleFormat('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors font-bold"
          title="Bold (Toggle)"
        >
          <span className="text-sm">B</span>
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors italic"
          title="Italic (Toggle)"
        >
          <span className="text-sm">I</span>
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('underline')}
          className="p-2 hover:bg-gray-200 rounded transition-colors underline"
          title="Underline (Toggle)"
        >
          <span className="text-sm">U</span>
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('strikeThrough')}
          className="p-2 hover:bg-gray-200 rounded transition-colors line-through"
          title="Strikethrough (Toggle)"
        >
          <span className="text-sm">S</span>
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => toggleFormat('formatBlock', 'h1')}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
          title="Heading 1 (Toggle)"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('formatBlock', 'h2')}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
          title="Heading 2 (Toggle)"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('formatBlock', 'h3')}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
          title="Heading 3 (Toggle)"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => toggleFormat('formatBlock', 'p')}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-sm"
          title="Paragraph (Toggle)"
        >
          P
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={insertUnorderedList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <Icon name="List" size={16} />
        </button>
        <button
          type="button"
          onClick={insertOrderedList}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <Icon name="ListOrdered" size={16} />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Align Left"
        >
          <Icon name="AlignLeft" size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Align Center"
        >
          <Icon name="AlignCenter" size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Align Right"
        >
          <Icon name="AlignRight" size={16} />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Link"
        >
          <Icon name="Link" size={16} />
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Clear Formatting */}
        <button
          type="button"
          onClick={clearFormatting}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Clear All Formatting"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          // Ensure Enter key creates proper paragraph tags
          if (e.key === 'Enter' && !e.shiftKey) {
            // Let the default behavior happen, then ensure it's a paragraph
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection.rangeCount) {
                let node = selection.anchorNode;
                while (node && node !== editorRef.current) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName?.toLowerCase();
                    // If Enter created a div or br, convert to paragraph
                    if (tagName === 'div' && node.parentNode === editorRef.current) {
                      const p = document.createElement('p');
                      p.innerHTML = node.innerHTML || '<br>';
                      node.parentNode.replaceChild(p, node);
                      // Move cursor to new paragraph
                      const range = document.createRange();
                      range.selectNodeContents(p);
                      range.collapse(false);
                      selection.removeAllRanges();
                      selection.addRange(range);
                      break;
                    }
                  }
                  node = node.parentNode;
                }
              }
              handleContentChange();
            }, 0);
          }
        }}
        className="min-h-[300px] p-4 text-foreground focus:outline-none prose prose-sm max-w-none"
        style={{
          wordBreak: 'break-word',
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable]:focus {
          outline: none;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          display: block;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          display: block;
        }
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          display: block;
        }
        [contenteditable] p {
          margin-top: 1em !important;
          margin-bottom: 1em !important;
          display: block;
        }
        [contenteditable] p:first-child {
          margin-top: 0 !important;
        }
        [contenteditable] p:last-child {
          margin-bottom: 0 !important;
        }
        [contenteditable] h1 + p,
        [contenteditable] h2 + p,
        [contenteditable] h3 + p,
        [contenteditable] h4 + p,
        [contenteditable] h5 + p,
        [contenteditable] h6 + p {
          margin-top: 0.5em !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;

