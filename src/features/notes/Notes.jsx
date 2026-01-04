import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import '../../styles.css';

const Notes = () => {
  const { notes, setNotes, addNoteRemote, updateNoteRemote, deleteNoteRemote } = useAppContext();
  const [newNote, setNewNote] = useState({ title: '', content: '', category: '', color: '#fef08a' });
  const [editingNote, setEditingNote] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Refs for textareas
  const newNoteTextareaRef = useRef(null);
  const editNoteTextareaRef = useRef(null);

  const colors = [
    { name: 'Yellow', value: '#fef08a' },
    { name: 'Pink', value: '#fecdd3' },
    { name: 'Blue', value: '#bfdbfe' },
    { name: 'Green', value: '#bbf7d0' },
    { name: 'Purple', value: '#e9d5ff' },
    { name: 'Orange', value: '#fed7aa' }
  ];

  const categories = [...new Set(notes?.map(n => n.category).filter(Boolean))] || [];

  const addNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return;
    
    const note = {
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      category: newNote.category.trim(),
      color: newNote.color,
      createdAt: new Date().toISOString(),
      pinned: false
    };

    const created = await addNoteRemote(note);
    if (created) {
      setNewNote({ title: '', content: '', category: '', color: '#fef08a' });
    }
  };

  const updateNote = async () => {
    if (!editingNote) return;
    
    await updateNoteRemote(editingNote.id, editingNote);
    setEditingNote(null);
  };

  const togglePin = async (id) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      await updateNoteRemote(id, { ...note, pinned: !note.pinned });
    }
  };

  const deleteNote = async (id) => {
    await deleteNoteRemote(id);
  };

  const handleKeyDown = (e, isEdit = false) => {
    const textarea = isEdit ? editNoteTextareaRef.current : newNoteTextareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const currentLineEnd = value.indexOf('\n', selectionStart);
    const currentLine = value.substring(currentLineStart, currentLineEnd === -1 ? value.length : currentLineEnd);
    
    // Handle Tab key for bullet points and indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      
      if (currentLine.trim() === '-') {
        // Convert - to bullet point
        const newContent = value.substring(0, currentLineStart) + '• ' + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd);
        if (isEdit) {
          setEditingNote(prev => ({ ...prev, content: newContent }));
        } else {
          setNewNote(prev => ({ ...prev, content: newContent }));
        }
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = currentLineStart + 2;
        }, 0);
      } else if (currentLine.startsWith('• ')) {
        const indentLevel = (currentLine.match(/^• /g) || []).length;
        if (e.shiftKey && indentLevel > 1) {
          // Shift+Tab = unindent
          const newBullet = '• '.repeat(indentLevel - 1);
          const newLine = currentLine.replace(/^• +/, newBullet);
          const newContent = value.substring(0, currentLineStart) + newLine + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd);
          if (isEdit) {
            setEditingNote(prev => ({ ...prev, content: newContent }));
          } else {
            setNewNote(prev => ({ ...prev, content: newContent }));
          }
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = currentLineStart + newLine.length;
          }, 0);
        } else if (!e.shiftKey) {
          // Tab = indent
          const newBullet = '• '.repeat(indentLevel + 1);
          const newLine = currentLine.replace(/^• +/, newBullet);
          const newContent = value.substring(0, currentLineStart) + newLine + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd);
          if (isEdit) {
            setEditingNote(prev => ({ ...prev, content: newContent }));
          } else {
            setNewNote(prev => ({ ...prev, content: newContent }));
          }
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = currentLineStart + newLine.length;
          }, 0);
        }
      }
      return;
    }

    // Handle Enter key for continuing lists
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentLine.startsWith('• ')) {
        // Check if it's just an empty bullet
        if (currentLine.trim() === '•') {
          // Remove the bullet and go back to regular line
          const newContent = value.substring(0, currentLineStart) + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd);
          if (isEdit) {
            setEditingNote(prev => ({ ...prev, content: newContent }));
          } else {
            setNewNote(prev => ({ ...prev, content: newContent }));
          }
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = currentLineStart;
          }, 0);
        } else {
          // Continue bullet list - create new bullet
          const indentMatch = currentLine.match(/^(• +)/);
          const indent = indentMatch ? indentMatch[1] : '• ';
          const newContent = value.substring(0, selectionStart) + '\n' + indent + value.substring(selectionEnd);
          if (isEdit) {
            setEditingNote(prev => ({ ...prev, content: newContent }));
          } else {
            setNewNote(prev => ({ ...prev, content: newContent }));
          }
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + indent.length;
          }, 0);
        }
      } else if (currentLine.match(/^\d+\. /)) {
        // Continue numbered list
        const numberMatch = currentLine.match(/^(\d+)\. /);
        const nextNumber = parseInt(numberMatch[1]) + 1;
        const newContent = value.substring(0, selectionStart) + '\n' + nextNumber + '. ' + value.substring(selectionEnd);
        if (isEdit) {
          setEditingNote(prev => ({ ...prev, content: newContent }));
        } else {
          setNewNote(prev => ({ ...prev, content: newContent }));
        }
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1 + (nextNumber.toString().length + 2);
        }, 0);
      } else if (currentLine.trim() === '') {
        // Empty line - just add newline
        const newContent = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
        if (isEdit) {
          setEditingNote(prev => ({ ...prev, content: newContent }));
        } else {
          setNewNote(prev => ({ ...prev, content: newContent }));
        }
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      } else {
        // Regular enter
        const newContent = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
        if (isEdit) {
          setEditingNote(prev => ({ ...prev, content: newContent }));
        } else {
          setNewNote(prev => ({ ...prev, content: newContent }));
        }
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
        }, 0);
      }
      return;
    }

    // Handle Backspace for list management
    if (e.key === 'Backspace') {
      if (currentLine.startsWith('• ') && selectionStart === currentLineStart + 2 && selectionEnd === selectionStart) {
        // Remove bullet if cursor is right after it
        e.preventDefault();
        const newContent = value.substring(0, currentLineStart) + currentLine.substring(2) + value.substring(currentLineEnd === -1 ? value.length : currentLineEnd);
        if (isEdit) {
          setEditingNote(prev => ({ ...prev, content: newContent }));
        } else {
          setNewNote(prev => ({ ...prev, content: newContent }));
        }
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = currentLineStart;
        }, 0);
        return;
      }
    }
  };

  const handleInput = (e, isEdit = false) => {
    const value = e.target.value;
    let processedValue = value;

    // Auto-convert -> to →
    processedValue = processedValue.replace(/->/g, '→');

    // Auto-convert *text* to **text** (bold) - only when not already bold
    processedValue = processedValue.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '**$1**');

    // Auto-convert numbered lists (1. becomes 1. ) - but only at line start
    processedValue = processedValue.replace(/^(\d+)\.([^\s\d])/gm, '$1. $2');

    if (processedValue !== value) {
      if (isEdit) {
        setEditingNote(prev => ({ ...prev, content: processedValue }));
      } else {
        setNewNote(prev => ({ ...prev, content: processedValue }));
      }
      
      // Restore cursor position more accurately
      setTimeout(() => {
        const textarea = isEdit ? editNoteTextareaRef.current : newNoteTextareaRef.current;
        if (textarea) {
          // Try to maintain cursor position relative to content changes
          const cursorPos = Math.min(e.target.selectionStart, processedValue.length);
          textarea.selectionStart = cursorPos;
          textarea.selectionEnd = cursorPos;
        }
      }, 0);
    } else {
      if (isEdit) {
        setEditingNote(prev => ({ ...prev, content: value }));
      } else {
        setNewNote(prev => ({ ...prev, content: value }));
      }
    }
  };

  const insertFormatting = (formatType) => {
    const textarea = newNoteTextareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newNote.content.substring(start, end);
    let formattedText = '';
    
    switch (formatType) {
      case 'bullet':
        formattedText = selectedText ? `• ${selectedText}` : '• ';
        break;
      case 'number':
        formattedText = selectedText ? `1. ${selectedText}` : '1. ';
        break;
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '****';
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '**';
        break;
      case 'code':
        formattedText = selectedText ? `\`${selectedText}\`` : '``';
        break;
      default:
        return;
    }
    
    const newContent = newNote.content.substring(0, start) + formattedText + newNote.content.substring(end);
    setNewNote(prev => ({ ...prev, content: newContent }));
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertFormattingEdit = (formatType) => {
    if (!editingNote) return;
    
    const textarea = editNoteTextareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editingNote.content.substring(start, end);
    let formattedText = '';
    
    switch (formatType) {
      case 'bullet':
        formattedText = selectedText ? `• ${selectedText}` : '• ';
        break;
      case 'number':
        formattedText = selectedText ? `1. ${selectedText}` : '1. ';
        break;
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '****';
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '**';
        break;
      case 'code':
        formattedText = selectedText ? `\`${selectedText}\`` : '``';
        break;
      default:
        return;
    }
    
    const newContent = editingNote.content.substring(0, start) + formattedText + editingNote.content.substring(end);
    setEditingNote(prev => ({ ...prev, content: newContent }));
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderFormattedContent = (content) => {
    if (!content) return null;
    
    // Simple markdown-like rendering
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Handle bullet points
      if (line.trim().startsWith('• ')) {
        return (
          <div key={index} style={{ marginLeft: '16px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '-16px' }}>•</span>
            {line.substring(2)}
          </div>
        );
      }
      
      // Handle numbered lists
      const numberMatch = line.trim().match(/^(\d+)\.\s/);
      if (numberMatch) {
        return (
          <div key={index} style={{ marginLeft: '20px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '-20px' }}>{numberMatch[1]}.</span>
            {line.substring(numberMatch[0].length)}
          </div>
        );
      }
      
      // Handle bold text
      let processedLine = line;
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      processedLine = processedLine.replace(/`(.*?)`/g, '<code style="background-color: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 12px;">$1</code>');
      processedLine = processedLine.replace(/→/g, '<span style="color: #666;">→</span>');
      
      if (processedLine !== line) {
        return (
          <div key={index} dangerouslySetInnerHTML={{ __html: processedLine }} />
        );
      }
      
      return <div key={index}>{line}</div>;
    });
  };

  const filteredNotes = (notes || [])
    .filter(note => filterCategory === 'all' || note.category === filterCategory)
    .filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalNotes = notes?.length || 0;
  const pinnedCount = notes?.filter(n => n.pinned).length || 0;
  const categoriesCount = categories.length;

  return (
    <div style={{
      height: 'calc(100vh - 250px)',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#f8f9fa'
    }}>

      {/* Left Sidebar - Create & Stats */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Stats */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>📊</span> Stats
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
              <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Total Notes</div>
              <div style={{fontSize: '24px', fontWeight: 'bold'}}>{totalNotes}</div>
            </div>
            <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
              <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Pinned</div>
              <div style={{fontSize: '24px', fontWeight: 'bold'}}>{pinnedCount}</div>
            </div>
            <div style={{padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px'}}>
              <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '4px'}}>Categories</div>
              <div style={{fontSize: '24px', fontWeight: 'bold'}}>{categoriesCount}</div>
            </div>
          </div>
        </div>

        {/* Create New Note */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          flex: 1,
          overflow: 'auto'
        }}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>➕</span> New Note
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Title"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '14px',
                fontWeight: '600'
              }}
            />
            
            <textarea
              ref={newNoteTextareaRef}
              placeholder="Content (Type - then Tab for bullets, 1. for numbers, *text* for bold, -> for arrows)"
              value={newNote.content}
              onChange={(e) => handleInput(e, false)}
              onKeyDown={(e) => handleKeyDown(e, false)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '13px',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            
            {/* Keyboard shortcuts hint */}
            <div style={{
              fontSize: '11px',
              color: '#6c757d',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              💡 - + Tab = • bullet, Enter = new bullet, Tab = indent, Shift+Tab = unindent, *text* → **bold**, 1. = numbered, -&gt; = →
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => insertFormatting('bullet')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                title="Add bullet point"
              >
                • Bullet
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('number')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                title="Add numbered list"
              >
                1. Number
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('bold')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                title="Bold text"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('italic')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                title="Italic text"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('code')}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e9ecef'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                title="Code snippet"
              >
                &lt;/&gt;
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Category (e.g., Prompts, Ideas, Work)"
              value={newNote.category}
              onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value }))}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e0e0e0',
                fontSize: '13px'
              }}
            />
            
            <div>
              <div style={{fontSize: '11px', color: '#6c757d', marginBottom: '6px'}}>Color</div>
              <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                {colors.map(color => (
                  <div
                    key={color.value}
                    onClick={() => setNewNote(prev => ({ ...prev, color: color.value }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color.value,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: newNote.color === color.value ? '3px solid #333' : '1px solid #ddd',
                      transition: 'all 0.2s'
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={addNote}
              style={{
                padding: '10px 16px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#555'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#333'}
            >
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Notes Display */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header with Filters */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span>📝</span> Notes
            </h3>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '13px',
                  width: '200px'
                }}
              />
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px',
          alignContent: 'start'
        }}>
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <div
                key={note.id}
                style={{
                  backgroundColor: note.color,
                  borderRadius: '8px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  minHeight: '150px',
                  maxHeight: '300px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                {/* Pin Icon */}
                <div
                  onClick={async (e) => {
                    e.stopPropagation();
                    await togglePin(note.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    opacity: note.pinned ? 1 : 0.3,
                    transition: 'opacity 0.2s'
                  }}
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  📌
                </div>

                {editingNote?.id === note.id ? (
                  <>
                    <input
                      type="text"
                      value={editingNote.title}
                      onChange={(e) => setEditingNote(prev => ({ ...prev, title: e.target.value }))}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: 'rgba(255,255,255,0.5)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <textarea
                      ref={editNoteTextareaRef}
                      value={editingNote.content}
                      onChange={(e) => handleInput(e, true)}
                      onKeyDown={(e) => handleKeyDown(e, true)}
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        fontSize: '13px',
                        flex: 1,
                        resize: 'none',
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        fontFamily: 'inherit'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    {/* Formatting Toolbar for Edit */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <button
                        type="button"
                        onClick={() => insertFormattingEdit('bullet')}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          border: '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        title="Add bullet point"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingEdit('number')}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          border: '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        title="Add numbered list"
                      >
                        1.
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingEdit('bold')}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          border: '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        title="Bold text"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingEdit('italic')}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          border: '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontStyle: 'italic',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        title="Italic text"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormattingEdit('code')}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          border: '1px solid rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        title="Code snippet"
                      >
                        &lt;/&gt;
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editingNote.category}
                      onChange={(e) => setEditingNote(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Category"
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        fontSize: '12px',
                        backgroundColor: 'rgba(255,255,255,0.5)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateNote();
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNote(null);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          backgroundColor: 'rgba(0,0,0,0.3)',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {note.title && (
                      <h4 style={{
                        margin: 0,
                        fontSize: '15px',
                        fontWeight: 'bold',
                        color: '#333',
                        paddingRight: '24px'
                      }}>
                        {note.title}
                      </h4>
                    )}
                    
                    <div style={{
                      fontSize: '13px',
                      color: '#444',
                      flex: 1,
                      overflow: 'auto',
                      lineHeight: '1.5'
                    }}>
                      {renderFormattedContent(note.content)}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {note.category && (
                        <span style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontWeight: '600'
                        }}>
                          {note.category}
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingNote(note);
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
                              await deleteNote(note.id);
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'rgba(220,38,38,0.2)',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.3)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.2)'}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      {new Date(note.createdAt).toLocaleString()}
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="section-card">
                <div className="empty-state">
                  <div className="empty-illustration">📒</div>
                  <div className="empty-title">{searchTerm || filterCategory !== 'all' ? 'No notes match your filters' : 'No notes yet'}</div>
                  <div className="empty-subtext">{searchTerm || filterCategory !== 'all' ? 'Try adjusting your search or category.' : 'Create your first note to get started.'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
