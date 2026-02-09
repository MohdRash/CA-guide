import React, { useState, useRef, useEffect } from 'react';
import { Subject, DifficultyLevel, Lesson, LearningStyle, ExamConfig, Language, LessonSection } from '../types';
import { generateLessonStream } from '../services/gemini';
import { BookOpen, GraduationCap, Search, Sparkles, ChevronRight, BookText, BrainCircuit, PlayCircle, Bookmark, BookmarkCheck, Trash2, Library, Plus, StickyNote, Save, PenLine, Clock } from 'lucide-react';

interface ClassesScreenProps {
  onStartQuiz: (config: ExamConfig) => void;
  language: Language;
}

interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
}

const ClassesScreen: React.FC<ClassesScreenProps> = ({ onStartQuiz, language }) => {
  const [subject, setSubject] = useState<Subject>(Subject.ACCOUNTING);
  const [level, setLevel] = useState<DifficultyLevel>(DifficultyLevel.FOUNDATION);
  const [style, setStyle] = useState<LearningStyle>(LearningStyle.CONCEPTUAL);
  const [topic, setTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'generate' | 'saved' | 'notes'>('generate');
  
  // Bookmarks State
  const [savedLessons, setSavedLessons] = useState<Lesson[]>([]);
  
  // Notes State
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  const streamBufferRef = useRef<string>('');

  // Load data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ca-saved-lessons');
      if (saved) setSavedLessons(JSON.parse(saved));
      
      const userNotes = localStorage.getItem('ca-user-notes');
      if (userNotes) setNotes(JSON.parse(userNotes));
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }
  }, []);

  const saveLessonsToStorage = (lessons: Lesson[]) => {
    localStorage.setItem('ca-saved-lessons', JSON.stringify(lessons));
    setSavedLessons(lessons);
  };

  // --- Lesson Logic ---

  const parseMarkdownToSections = (markdown: string): LessonSection[] => {
    const sections: LessonSection[] = [];
    const lines = markdown.split('\n');
    let currentTitle = '';
    let currentContent: string[] = [];

    const pushSection = () => {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim()
        });
      }
    };

    for (const line of lines) {
      if (line.trim().startsWith('## ')) {
        pushSection();
        currentTitle = line.trim().substring(3).trim(); 
        currentContent = [];
      } else {
        if (currentTitle) {
          currentContent.push(line);
        }
      }
    }
    pushSection();
    return sections;
  };

  const handleStartClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    setActiveTab('generate');
    setLesson({
        topic: topic,
        subject: subject,
        level: level,
        sections: []
    });
    streamBufferRef.current = '';

    try {
      const stream = generateLessonStream(subject, level, topic, style, language);
      for await (const chunk of stream) {
        if (chunk) {
          streamBufferRef.current += chunk;
          const parsedSections = parseMarkdownToSections(streamBufferRef.current);
          setLesson(prev => prev ? { ...prev, sections: parsedSections } : null);
        }
      }
    } catch (error) {
      alert("Connection interrupted. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTakeQuiz = () => {
    if (!lesson) return;
    onStartQuiz({
      subject: lesson.subject as Subject,
      level: lesson.level as DifficultyLevel,
      questionCount: 5,
      durationMinutes: 5,
      topic: lesson.topic,
      language: language
    });
  };

  const isBookmarked = lesson && savedLessons.some(l => l.topic === lesson.topic && l.subject === lesson.subject);

  const toggleBookmark = () => {
    if (!lesson) return;
    if (isBookmarked) {
      const newLessons = savedLessons.filter(l => !(l.topic === lesson.topic && l.subject === lesson.subject));
      saveLessonsToStorage(newLessons);
    } else {
      const newLessons = [lesson, ...savedLessons];
      saveLessonsToStorage(newLessons);
    }
  };

  const loadBookmark = (savedLesson: Lesson) => {
    setLesson(savedLesson);
    setSubject(savedLesson.subject as Subject);
    setLevel(savedLesson.level as unknown as DifficultyLevel);
    setTopic(savedLesson.topic);
    setActiveTab('generate'); // Switch back to view mode
  };

  const deleteBookmark = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm("Delete this saved class?")) {
      const newLessons = [...savedLessons];
      newLessons.splice(index, 1);
      saveLessonsToStorage(newLessons);
    }
  };

  // --- Notes Logic ---

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      lastModified: Date.now(),
    };
    
    setNotes(prev => {
      const updated = [newNote, ...prev];
      localStorage.setItem('ca-user-notes', JSON.stringify(updated));
      return updated;
    });
    setActiveNoteId(newNote.id);
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => {
      const updatedNotes = prev.map(n => 
        n.id === id ? { ...n, ...updates, lastModified: Date.now() } : n
      );
      localStorage.setItem('ca-user-notes', JSON.stringify(updatedNotes));
      return updatedNotes;
    });
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm("Are you sure you want to delete this note?")) {
      setNotes(prev => {
        const updated = prev.filter(n => n.id !== id);
        localStorage.setItem('ca-user-notes', JSON.stringify(updated));
        return updated;
      });
      
      if (activeNoteId === id) {
        setActiveNoteId(null);
      }
    }
  };

  const getActiveNote = () => notes.find(n => n.id === activeNoteId);

  // --- Render Helpers ---

  const renderNoteEditor = () => {
    const note = getActiveNote();
    if (!note) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
           <StickyNote size={64} className="mb-4 text-ca-200" />
           <p className="text-lg font-medium text-gray-500">Select a note to edit</p>
           <button 
             onClick={handleCreateNote}
             className="mt-4 px-6 py-2 bg-ca-600 text-white rounded-lg hover:bg-ca-700 transition-colors font-medium"
           >
             Create New Note
           </button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <input
            type="text"
            value={note.title}
            onChange={(e) => handleUpdateNote(note.id, { title: e.target.value })}
            placeholder="Note Title..."
            className="text-2xl font-bold bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-300 w-full"
          />
          <div className="flex items-center gap-3 ml-4">
            <div className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
              <Clock size={12} />
              <span className="hidden sm:inline">Saved</span> {new Date(note.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button 
              onClick={(e) => handleDeleteNote(e, note.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete Note"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 p-0">
          <textarea
            value={note.content}
            onChange={(e) => handleUpdateNote(note.id, { content: e.target.value })}
            placeholder="Start typing your notes here..."
            className="w-full h-full p-6 resize-none focus:ring-0 border-none text-gray-600 leading-relaxed text-lg"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar / Control Panel */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col h-auto md:h-[calc(100vh-4rem)]">
        
        {/* Sidebar Header */}
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BrainCircuit className="text-ca-600" />
            CA Mastermind AI
          </h2>
          <p className="text-sm text-gray-500 mt-1">Your personal expert tutor.</p>
          <div className="mt-2 inline-flex items-center px-2 py-1 bg-ca-50 text-ca-700 text-xs rounded-md font-medium">
            Language: {language}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 mt-4">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
              activeTab === 'generate' ? 'text-ca-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus size={16} />
            Class
            {activeTab === 'generate' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ca-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
              activeTab === 'saved' ? 'text-ca-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Library size={16} />
            Library
            {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ca-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 pb-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
              activeTab === 'notes' ? 'text-ca-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <StickyNote size={16} />
            Notes
            {activeTab === 'notes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-ca-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'generate' && (
            <form onSubmit={handleStartClass} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Target Level</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(DifficultyLevel).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                        level === l
                          ? 'bg-ca-50 border-ca-500 text-ca-700 font-medium'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {l}
                      {level === l && <div className="w-2 h-2 rounded-full bg-ca-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-ca-500 focus:border-ca-500 outline-none text-sm"
                >
                  {Object.values(Subject).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teaching Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as LearningStyle)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-ca-500 focus:border-ca-500 outline-none text-sm"
                >
                  {Object.values(LearningStyle).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Topic to Master</label>
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. GST Input Tax Credit..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-ca-500 focus:border-ca-500 outline-none"
                    required
                  />
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !topic.trim()}
                className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  isGenerating
                    ? 'bg-ca-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-ca-700 to-ca-500 hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="animate-spin" size={18} />
                    Streaming...
                  </>
                ) : (
                  <>
                    Teach Me
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              {savedLessons.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Library size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No saved lessons.</p>
                  <button onClick={() => setActiveTab('generate')} className="mt-2 text-ca-600 text-sm font-medium hover:underline">
                    Create your first class
                  </button>
                </div>
              ) : (
                savedLessons.map((saved, idx) => (
                  <div 
                    key={idx}
                    onClick={() => loadBookmark(saved)}
                    className={`group p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      lesson?.topic === saved.topic && lesson?.subject === saved.subject && activeTab !== 'notes'
                        ? 'bg-ca-50 border-ca-300 ring-1 ring-ca-200'
                        : 'bg-white border-gray-200 hover:border-ca-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight">{saved.topic}</h3>
                      <button
                        onClick={(e) => deleteBookmark(e, idx)}
                        className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">{saved.subject}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
               <button 
                onClick={handleCreateNote}
                className="w-full py-2 px-4 border border-dashed border-ca-300 rounded-lg text-ca-600 font-medium hover:bg-ca-50 flex items-center justify-center gap-2 mb-4"
              >
                <Plus size={16} /> New Note
              </button>
              
              {notes.length === 0 ? (
                 <div className="text-center py-8 text-gray-400">
                   <StickyNote size={32} className="mx-auto mb-2 opacity-20" />
                   <p className="text-xs">No notes yet.</p>
                 </div>
              ) : (
                notes.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => setActiveNoteId(n.id)}
                    className={`group p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      activeNoteId === n.id
                        ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                        : 'bg-white border-gray-200 hover:border-amber-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-sm line-clamp-1 ${!n.title ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                        {n.title || 'Untitled Note'}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteNote(e, n.id)}
                        className="text-gray-400 hover:text-red-500 p-2 -mr-2 transition-colors rounded-full hover:bg-red-50"
                        title="Delete Note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                      {n.content || 'No content...'}
                    </p>
                    <div className="text-[10px] text-gray-400">
                      {new Date(n.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 h-auto md:h-[calc(100vh-4rem)] overflow-y-auto bg-slate-50/50">
        {activeTab === 'notes' ? (
          renderNoteEditor()
        ) : (
          lesson ? (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
              <header className="mb-8 border-b border-gray-200 pb-6 flex items-start justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-ca-600 font-medium mb-3 uppercase tracking-wide">
                    <span className="bg-ca-100 px-3 py-1 rounded-full">{lesson.level}</span>
                    <span>•</span>
                    <span>{lesson.subject}</span>
                    <span>•</span>
                    <span>{language}</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                    {lesson.topic}
                  </h1>
                </div>
                
                {!isGenerating && (
                  <button
                    onClick={toggleBookmark}
                    className={`flex-shrink-0 p-3 rounded-full transition-all ${
                      isBookmarked 
                        ? 'bg-ca-100 text-ca-600 hover:bg-ca-200' 
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                    }`}
                    title={isBookmarked ? "Remove from saved" : "Save this lesson"}
                  >
                    {isBookmarked ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
                  </button>
                )}
              </header>

              <div className="space-y-8">
                {lesson.sections.map((section, idx) => (
                  <section key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-all hover:shadow-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ca-100 to-ca-200 text-ca-700 flex items-center justify-center text-sm font-bold shadow-sm">
                        {idx + 1}
                      </div>
                      {section.title}
                    </h3>
                    <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-light">
                      {section.content}
                      {isGenerating && idx === lesson.sections.length - 1 && (
                        <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-ca-500 animate-pulse" />
                      )}
                    </div>
                  </section>
                ))}
                
                {isGenerating && lesson.sections.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                     <div className="animate-pulse flex flex-col items-center">
                       <div className="h-12 w-12 bg-ca-100 rounded-full mb-4 flex items-center justify-center">
                          <BrainCircuit className="text-ca-300 animate-spin-slow" size={24} />
                       </div>
                       <p className="text-ca-600 font-medium text-sm">Initializing Mastermind Protocol...</p>
                     </div>
                  </div>
                )}
              </div>

              {!isGenerating && lesson.sections.length > 0 && (
                <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8 text-center shadow-lg flex flex-col items-center animate-fade-in">
                  <h3 className="text-xl font-bold mb-2">Mastermind Session Complete</h3>
                  <p className="opacity-80 mb-6">You've just leveled up your understanding. Ready to test this knowledge?</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={toggleBookmark}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      {isBookmarked ? 'Saved to Library' : 'Save for Later'}
                    </button>
                    <button 
                      onClick={handleTakeQuiz}
                      className="bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2 transform hover:scale-105"
                    >
                      <PlayCircle size={20} className="text-ca-600" />
                      Take Practice Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="max-w-md">
                <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 inline-flex border border-gray-100">
                  <BrainCircuit size={48} className="text-ca-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">CA Mastermind AI</h3>
                <p className="text-gray-500 leading-relaxed">
                  I can make you a topper. Whether you are a beginner needing simple concepts or a Final student needing advanced case law analysis, I adapt to you.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 text-left">
                    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="font-bold text-gray-900 mb-1">Simplify</div>
                        <div className="text-xs text-gray-500">Break down complex jargon into plain English.</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="font-bold text-gray-900 mb-1">Score High</div>
                        <div className="text-xs text-gray-500">Learn keywords and presentation tips for exams.</div>
                    </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ClassesScreen;