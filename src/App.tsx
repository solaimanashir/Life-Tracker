import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutGrid,
  BookOpen,
  Users,
  DollarSign,
  Film,
  ChevronsLeft,
  Plus,
  X,
  Star,
  Minus,
  Menu,
  Download,
  Upload,
} from 'lucide-react';

const STORAGE_KEYS = {
  schedule: 'dashboard_schedule',
  classes: 'dashboard_classes',
  exams: 'dashboard_exams',
  syllabus: 'dashboard_syllabus',
  courses: 'dashboard_courses',
  students: 'dashboard_students',
  expenses: 'dashboard_expenses',
  budget: 'dashboard_budget',
  watchlist: 'dashboard_watchlist',
  completed: 'dashboard_completed',
  pomodoro: 'dashboard_pomodoro',
};

function getData<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setData(key: string, data: unknown[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getValue(key: string) {
  return localStorage.getItem(key);
}

function setValue(key: string, value: string) {
  localStorage.setItem(key, value);
}

type Section = 'overview' | 'academic' | 'tuition' | 'budget' | 'entertainment';
type ModalId =
  | 'scheduleModal'
  | 'classModal'
  | 'examModal'
  | 'syllabusModal'
  | 'courseModal'
  | 'studentModal'
  | 'ratingModal';

interface ScheduleItem { id: number; title: string; time: string; day: number; }
interface ClassItem { id: number; name: string; room: string; time: string; day: number; }
interface ExamItem { id: number; subject: string; date: string; topics: string; }
interface SyllabusItem { id: number; subject: string; topic: string; status: 'pending' | 'in-progress' | 'done'; }
interface CourseItem { id: number; name: string; credits: number; grade: number; }
interface StudentItem { id: number; name: string; subject: string; fee: number; days: string[]; paid: boolean; attendance: number; }
interface ExpenseItem { id: number; amount: number; note: string; category: string; date: string; }
interface MediaItem { id: number; title: string; type: string; genre: string; }
interface CompletedItem extends MediaItem { rating: number; review: string; completedDate: string; }
interface PomodoroDay { date: string; sessions: number; totalMinutes: number; }

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMETABLE_DAYS = [0, 1, 2, 3, 4, 5, 6];

const GRADE_LABELS: Record<number, string> = {
  4.0: 'A', 3.7: 'A-', 3.3: 'B+', 3.0: 'B', 2.7: 'B-', 2.3: 'C+', 2.0: 'C', 1.7: 'C-', 1.3: 'D+', 1.0: 'D', 0: 'F',
};

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-cyan/20 text-cyan', series: 'bg-purple/20 text-purple', game: 'bg-emerald/20 text-emerald', anime: 'bg-orange/20 text-orange',
};

const CATEGORY_COLORS_TEXT: Record<string, string> = {
  food: 'text-orange', transport: 'text-cyan', education: 'text-purple', entertainment: 'text-pink-400', utilities: 'text-emerald', other: 'text-muted',
};

const CATEGORY_COLORS_BG: Record<string, string> = {
  food: 'bg-orange', transport: 'bg-cyan', education: 'bg-purple', entertainment: 'bg-pink-400', utilities: 'bg-emerald', other: 'bg-muted',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-red/20 text-red', 'in-progress': 'bg-orange/20 text-orange', done: 'bg-emerald/20 text-emerald',
};

function App() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'completed'>('watchlist');
  const [activeModal, setActiveModal] = useState<ModalId | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [classDays, setClassDays] = useState<number[]>([]);
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [studentDays, setStudentDays] = useState<string[]>([]);

  const [schedule, setSchedule] = useState<ScheduleItem[]>(getData(STORAGE_KEYS.schedule));
  const [classes, setClasses] = useState<ClassItem[]>(getData(STORAGE_KEYS.classes));
  const [exams, setExams] = useState<ExamItem[]>(getData(STORAGE_KEYS.exams));
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(getData(STORAGE_KEYS.syllabus));
  const [courses, setCourses] = useState<CourseItem[]>(getData(STORAGE_KEYS.courses));
  const [students, setStudents] = useState<StudentItem[]>(getData(STORAGE_KEYS.students));
  const [expenses, setExpenses] = useState<ExpenseItem[]>(getData(STORAGE_KEYS.expenses));
  const [budget, setBudget] = useState(getValue(STORAGE_KEYS.budget) || '');
  const [watchlist, setWatchlist] = useState<MediaItem[]>(getData(STORAGE_KEYS.watchlist));
  const [completed, setCompleted] = useState<CompletedItem[]>(getData(STORAGE_KEYS.completed));
  const [pomodoroData, setPomodoroData] = useState<PomodoroDay[]>(getData(STORAGE_KEYS.pomodoro));

  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const pomodoroIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingMediaId, setRatingMediaId] = useState<number>(0);
  const ratingReviewRef = useRef<HTMLTextAreaElement>(null);

  const scheduleTitleRef = useRef<HTMLInputElement>(null);
  const scheduleTimeRef = useRef<HTMLInputElement>(null);
  const classNameRef = useRef<HTMLInputElement>(null);
  const classRoomRef = useRef<HTMLInputElement>(null);
  const classTimeRef = useRef<HTMLInputElement>(null);
  const examSubjectRef = useRef<HTMLInputElement>(null);
  const examDateRef = useRef<HTMLInputElement>(null);
  const examTopicsRef = useRef<HTMLInputElement>(null);
  const syllabusSubjectRef = useRef<HTMLInputElement>(null);
  const syllabusTopicRef = useRef<HTMLInputElement>(null);
  const syllabusStatusRef = useRef<HTMLSelectElement>(null);
  const courseNameRef = useRef<HTMLInputElement>(null);
  const courseCreditsRef = useRef<HTMLSelectElement>(null);
  const courseGradeRef = useRef<HTMLSelectElement>(null);
  const studentNameRef = useRef<HTMLInputElement>(null);
  const studentSubjectRef = useRef<HTMLInputElement>(null);
  const studentFeeRef = useRef<HTMLInputElement>(null);
  const expenseAmountRef = useRef<HTMLInputElement>(null);
  const expenseNoteRef = useRef<HTMLInputElement>(null);
  const expenseCategoryRef = useRef<HTMLSelectElement>(null);
  const mediaTitleRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<HTMLSelectElement>(null);
  const mediaGenreRef = useRef<HTMLInputElement>(null);
  const goalCGPARef = useRef<HTMLInputElement>(null);
  const remainingCreditsRef = useRef<HTMLInputElement>(null);
  const monthlyBudgetRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setData(STORAGE_KEYS.schedule, schedule); }, [schedule]);
  useEffect(() => { setData(STORAGE_KEYS.classes, classes); }, [classes]);
  useEffect(() => { setData(STORAGE_KEYS.exams, exams); }, [exams]);
  useEffect(() => { setData(STORAGE_KEYS.syllabus, syllabus); }, [syllabus]);
  useEffect(() => { setData(STORAGE_KEYS.courses, courses); }, [courses]);
  useEffect(() => { setData(STORAGE_KEYS.students, students); }, [students]);
  useEffect(() => { setData(STORAGE_KEYS.expenses, expenses); }, [expenses]);
  useEffect(() => { setValue(STORAGE_KEYS.budget, budget); }, [budget]);
  useEffect(() => { setData(STORAGE_KEYS.watchlist, watchlist); }, [watchlist]);
  useEffect(() => { setData(STORAGE_KEYS.completed, completed); }, [completed]);
  useEffect(() => { setData(STORAGE_KEYS.pomodoro, pomodoroData); }, [pomodoroData]);

  const completePomodoro = useCallback(() => {
    const today = new Date().toDateString();
    setPomodoroData((prev) => {
      const idx = prev.findIndex((d) => d.date === today);
      const newData = [...prev];
      if (idx >= 0) {
        newData[idx] = { ...newData[idx], sessions: newData[idx].sessions + 1, totalMinutes: newData[idx].totalMinutes + pomodoroMinutes };
      } else {
        newData.push({ date: today, sessions: 1, totalMinutes: pomodoroMinutes });
      }
      return newData;
    });
    alert('Pomodoro complete! Great work!');
  }, [pomodoroMinutes]);

  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroSeconds((prev) => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            completePomodoro();
            return pomodoroMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
      pomodoroIntervalRef.current = null;
    }
    return () => { if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current); };
  }, [pomodoroRunning, completePomodoro, pomodoroMinutes]);

  const todaySchedule = schedule.filter((s) => s.day === new Date().getDay()).sort((a, b) => a.time.localeCompare(b.time));
  const cgpa = courses.length > 0 ? (courses.reduce((s, c) => s + c.grade * c.credits, 0) / courses.reduce((s, c) => s + c.credits, 0)).toFixed(2) : '0.00';
  const totalCredits = courses.reduce((s, c) => s + c.credits, 0);
  const tuitionCollected = students.filter((s) => s.paid).reduce((s, st) => s + st.fee, 0);
  const tuitionPending = students.filter((s) => !s.paid).length;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetNum = parseFloat(budget) || 0;
  const netAvailable = tuitionCollected - totalSpent;
  const budgetRemaining = budgetNum - totalSpent;
  const budgetPercent = budgetNum > 0 ? Math.min(100, (totalSpent / budgetNum) * 100) : 0;
  const now = new Date();
  const upcomingClasses = todaySchedule.filter((item) => { const [h, m] = item.time.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0); return d > now; });
  const todayPomodoro = pomodoroData.find((d) => d.date === new Date().toDateString()) || { sessions: 0, totalMinutes: 0 };
  const netExpenses = totalSpent;
  const categoryBreakdown = expenses.reduce((acc, exp) => { acc[exp.category] = (acc[exp.category] || 0) + exp.amount; return acc; }, {} as Record<string, number>);
  const categoryTotal = Object.values(categoryBreakdown).reduce((a, b) => a + b, 0);
  const timeSlots = [...new Set(classes.map((c) => c.time))].sort();
  const pomodoroMins = Math.floor(pomodoroSeconds / 60);
  const pomodoroSecs = pomodoroSeconds % 60;
  const pomodoroDisplay = String(pomodoroMins).padStart(2, '0') + ':' + String(pomodoroSecs).padStart(2, '0');

  const openModal = (id: ModalId) => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  const addSchedule = () => {
    const title = scheduleTitleRef.current?.value; const time = scheduleTimeRef.current?.value;
    if (!title || !time) return alert('Please fill all fields');
    if (scheduleDays.length === 0) return alert('Please select at least one day');
    const baseId = Date.now();
    const newItems = scheduleDays.map((day, i) => ({ id: baseId + i, title, time, day }));
    setSchedule((p) => [...p, ...newItems]);
    if (scheduleTitleRef.current) scheduleTitleRef.current.value = '';
    if (scheduleTimeRef.current) scheduleTimeRef.current.value = '';
    setScheduleDays([]);
    closeModal();
  };
  const addClass = () => {
    const name = classNameRef.current?.value; const room = classRoomRef.current?.value; const time = classTimeRef.current?.value;
    if (!name || !time) return alert('Please fill required fields');
    if (classDays.length === 0) return alert('Please select at least one day');
    const baseId = Date.now();
    const newClasses = classDays.map((day, i) => ({ id: baseId + i, name, room: room || '', time, day }));
    setClasses((p) => [...p, ...newClasses]);
    if (classNameRef.current) classNameRef.current.value = '';
    if (classRoomRef.current) classRoomRef.current.value = '';
    if (classTimeRef.current) classTimeRef.current.value = '';
    setClassDays([]);
    closeModal();
  };
  const addExam = () => {
    const subject = examSubjectRef.current?.value; const date = examDateRef.current?.value; const topics = examTopicsRef.current?.value;
    if (!subject || !date) return alert('Please fill required fields');
    setExams((p) => [...p, { id: Date.now(), subject, date, topics: topics || '' }]);
    if (examSubjectRef.current) examSubjectRef.current.value = '';
    if (examDateRef.current) examDateRef.current.value = '';
    if (examTopicsRef.current) examTopicsRef.current.value = '';
    closeModal();
  };
  const addSyllabus = () => {
    const subject = syllabusSubjectRef.current?.value; const topic = syllabusTopicRef.current?.value; const status = syllabusStatusRef.current?.value as SyllabusItem['status'];
    if (!subject || !topic) return alert('Please fill required fields');
    setSyllabus((p) => [...p, { id: Date.now(), subject, topic, status }]);
    if (syllabusSubjectRef.current) syllabusSubjectRef.current.value = '';
    if (syllabusTopicRef.current) syllabusTopicRef.current.value = '';
    closeModal();
  };
  const addCourse = () => {
    const name = courseNameRef.current?.value; const credits = parseFloat(courseCreditsRef.current?.value || ''); const grade = parseFloat(courseGradeRef.current?.value || '');
    if (!name || !credits) return alert('Please fill required fields');
    setCourses((p) => [...p, { id: Date.now(), name, credits, grade }]);
    if (courseNameRef.current) courseNameRef.current.value = '';
    if (courseCreditsRef.current) courseCreditsRef.current.value = '';
    closeModal();
  };
  const addStudent = () => {
    const name = studentNameRef.current?.value; const subject = studentSubjectRef.current?.value; const fee = parseFloat(studentFeeRef.current?.value || '');
    if (!name || !fee) return alert('Please fill required fields');
    if (studentDays.length === 0) return alert('Please select at least one day');
    setStudents((p) => [...p, { id: Date.now(), name, subject: subject || '', fee, days: studentDays, paid: false, attendance: 0 }]);
    if (studentNameRef.current) studentNameRef.current.value = '';
    if (studentSubjectRef.current) studentSubjectRef.current.value = '';
    if (studentFeeRef.current) studentFeeRef.current.value = '';
    setStudentDays([]);
    closeModal();
  };
  const addExpense = () => {
    const amount = parseFloat(expenseAmountRef.current?.value || ''); const note = expenseNoteRef.current?.value || ''; const category = expenseCategoryRef.current?.value || 'other';
    if (!amount) return alert('Please enter an amount');
    setExpenses((p) => [...p, { id: Date.now(), amount, note, category, date: new Date().toISOString() }]);
    if (expenseAmountRef.current) expenseAmountRef.current.value = '';
    if (expenseNoteRef.current) expenseNoteRef.current.value = '';
  };
  const addMedia = () => {
    const title = mediaTitleRef.current?.value; const type = mediaTypeRef.current?.value || 'movie'; const genre = mediaGenreRef.current?.value || '';
    if (!title) return alert('Please enter a title');
    setWatchlist((p) => [...p, { id: Date.now(), title, type, genre }]);
    if (mediaTitleRef.current) mediaTitleRef.current.value = '';
    if (mediaGenreRef.current) mediaGenreRef.current.value = '';
  };
  const saveBudget = () => { setBudget(monthlyBudgetRef.current?.value || ''); };
  const simulateGoal = () => {
    const targetCGPA = parseFloat(goalCGPARef.current?.value || ''); const remainingCreds = parseFloat(remainingCreditsRef.current?.value || '');
    const el = document.getElementById('goalResult');
    if (!el) return;
    if (!targetCGPA || !remainingCreds) { el.innerHTML = 'Please enter target CGPA and remaining credits'; return; }
    const neededPoints = targetCGPA * (totalCredits + remainingCreds) - courses.reduce((s, c) => s + c.grade * c.credits, 0);
    const neededGPA = neededPoints / remainingCreds;
    if (neededGPA > 4.0) el.innerHTML = '<span style="color:#ef4444">Target not achievable. Required GPA: ' + neededGPA.toFixed(2) + '</span>';
    else if (neededGPA < 0) el.innerHTML = '<span style="color:#10b981">Already achieved!</span>';
    else el.innerHTML = 'Required GPA for remaining courses: <strong>' + neededGPA.toFixed(2) + '</strong>';
  };
  const completeMedia = () => {
    const item = watchlist.find((w) => w.id === ratingMediaId);
    if (!item) return;
    const review = ratingReviewRef.current?.value || '';
    setCompleted((p) => [...p, { ...item, rating: selectedRating, review, completedDate: new Date().toISOString() }]);
    setWatchlist((p) => p.filter((w) => w.id !== ratingMediaId));
    closeModal();
  };
  const quickExpense = () => {
    const amount = prompt('Enter expense amount (BDT):');
    if (amount && !isNaN(parseFloat(amount))) setExpenses((p) => [...p, { id: Date.now(), amount: parseFloat(amount), category: 'other', note: 'Quick add', date: new Date().toISOString() }]);
  };
  const openRatingModal = (id: number) => { setRatingMediaId(id); setSelectedRating(0); setActiveModal('ratingModal'); };
  const cycleSyllabusStatus = (id: number) => setSyllabus((p) => p.map((s) => { if (s.id !== id) return s; const order: SyllabusItem['status'][] = ['pending', 'in-progress', 'done']; return { ...s, status: order[(order.indexOf(s.status) + 1) % 3] }; }));
  const togglePayment = (id: number) => setStudents((p) => p.map((s) => s.id === id ? { ...s, paid: !s.paid, attendance: !s.paid ? 0 : s.attendance } : s));
  const updateAttendance = (id: number, delta: number) => setStudents((p) => p.map((s) => s.id === id ? { ...s, attendance: Math.max(0, s.attendance + delta) } : s));
  const startPomodoro = () => setPomodoroRunning(true);
  const pausePomodoro = () => setPomodoroRunning(false);
  const resetPomodoro = () => { setPomodoroRunning(false); setPomodoroSeconds(pomodoroMinutes * 60); };
  const handlePomodoroMinutesChange = (val: number) => { setPomodoroMinutes(val); if (!pomodoroRunning) setPomodoroSeconds(val * 60); };

  const exportBackup = () => {
    const backup: Record<string, unknown> = {};
    Object.entries(STORAGE_KEYS).forEach(([_key, storageKey]) => {
      backup[storageKey] = JSON.parse(localStorage.getItem(storageKey) || 'null');
    });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `life-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = () => { backupInputRef.current?.click(); };
  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.values(STORAGE_KEYS).forEach((storageKey) => {
          if (data[storageKey] !== undefined && data[storageKey] !== null) {
            localStorage.setItem(storageKey, JSON.stringify(data[storageKey]));
          }
        });
        setSchedule(getData(STORAGE_KEYS.schedule));
        setClasses(getData(STORAGE_KEYS.classes));
        setExams(getData(STORAGE_KEYS.exams));
        setSyllabus(getData(STORAGE_KEYS.syllabus));
        setCourses(getData(STORAGE_KEYS.courses));
        setStudents(getData(STORAGE_KEYS.students));
        setExpenses(getData(STORAGE_KEYS.expenses));
        setBudget(getValue(STORAGE_KEYS.budget) || '');
        setWatchlist(getData(STORAGE_KEYS.watchlist));
        setCompleted(getData(STORAGE_KEYS.completed));
        setPomodoroData(getData(STORAGE_KEYS.pomodoro));
        alert('Backup restored successfully!');
      } catch { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navItems: { section: Section; icon: React.ReactNode; label: string }[] = [
    { section: 'overview', icon: <LayoutGrid className="w-5 h-5" />, label: 'Overview' },
    { section: 'academic', icon: <BookOpen className="w-5 h-5" />, label: 'Academic Hub' },
    { section: 'tuition', icon: <Users className="w-5 h-5" />, label: 'Tuition Manager' },
    { section: 'budget', icon: <DollarSign className="w-5 h-5" />, label: 'Budget Tracker' },
    { section: 'entertainment', icon: <Film className="w-5 h-5" />, label: 'Entertainment' },
  ];

  return (
    <div className="flex min-h-screen text-foreground">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileSidebar(true)} className="fixed top-4 left-4 z-50 md:hidden glass p-2 rounded-lg text-foreground">
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar - desktop */}
      <aside className={`hidden md:flex ${sidebarCollapsed ? 'w-16' : 'w-64'} glass border-r border-border p-4 flex-col gap-2 transition-all duration-300`}>
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-xl font-bold shrink-0">L</div>
          {!sidebarCollapsed && <span className="text-xl font-semibold">Life Dashboard</span>}
        </div>
        {navItems.map((item) => (
          <button key={item.section} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all ${activeSection === item.section ? 'bg-cyan/10 text-cyan border-l-3 border-cyan' : 'text-muted hover:bg-white/5 border-l-3 border-transparent'}`} onClick={() => setActiveSection(item.section)}>
            {item.icon}
            {!sidebarCollapsed && <span>{item.label}</span>}
          </button>
        ))}
        <div className="mt-auto flex flex-col gap-2">
          {!sidebarCollapsed && (
            <div className="flex gap-2 px-2">
              <button onClick={exportBackup} className="flex-1 py-2 glass rounded-lg text-xs text-muted hover:bg-white/5 flex items-center justify-center gap-1"><Download className="w-3 h-3" />Export</button>
              <button onClick={importBackup} className="flex-1 py-2 glass rounded-lg text-xs text-muted hover:bg-white/5 flex items-center justify-center gap-1"><Upload className="w-3 h-3" />Import</button>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center justify-center w-full py-3 rounded-lg text-muted hover:bg-white/5 gap-3">
            <ChevronsLeft className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebar(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center text-xl font-bold shrink-0">L</div>
              <span className="text-xl font-semibold">Life Dashboard</span>
            </div>
            {navItems.map((item) => (
              <button key={item.section} className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all ${activeSection === item.section ? 'bg-cyan/10 text-cyan border-l-3 border-cyan' : 'text-muted hover:bg-white/5 border-l-3 border-transparent'}`} onClick={() => { setActiveSection(item.section); setMobileSidebar(false); }}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
            <div className="mt-auto flex flex-col gap-2">
              <div className="flex gap-2 px-2">
                <button onClick={exportBackup} className="flex-1 py-2 glass rounded-lg text-xs text-muted hover:bg-white/5 flex items-center justify-center gap-1"><Download className="w-3 h-3" />Export</button>
                <button onClick={importBackup} className="flex-1 py-2 glass rounded-lg text-xs text-muted hover:bg-white/5 flex items-center justify-center gap-1"><Upload className="w-3 h-3" />Import</button>
              </div>
              <button onClick={() => setMobileSidebar(false)} className="w-full py-2 text-muted hover:bg-white/5 rounded-lg">Close</button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-border z-40 flex justify-around py-2 px-1">
        {navItems.map((item) => (
          <button key={item.section} className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-xs ${activeSection === item.section ? 'text-cyan' : 'text-muted'}`} onClick={() => setActiveSection(item.section)}>
            {item.icon}
            <span className="text-[10px]">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <input ref={backupInputRef} type="file" accept=".json" className="hidden" onChange={handleBackupUpload} />

      {/* Main Content */}
      <main className="flex-1 p-6 pt-16 md:pt-6 pb-20 md:pb-6 overflow-auto">
        {/* Overview */}
        {activeSection === 'overview' && (
          <section>
            <h1 className="text-3xl font-bold mb-6 neon-text-cyan">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="glass rounded-xl p-4 glow-cyan">
                <div className="text-muted text-sm mb-1">Next Class</div>
                <div className="text-2xl font-bold text-cyan">{upcomingClasses.length > 0 ? upcomingClasses[0].time : '--'}</div>
                <div className="text-sm text-muted">{upcomingClasses.length > 0 ? upcomingClasses[0].title : 'No more classes today'}</div>
              </div>
              <div className="glass rounded-xl p-4 glow-emerald">
                <div className="text-muted text-sm mb-1">Tuition Collected</div>
                <div className="text-2xl font-bold text-emerald">{tuitionCollected} BDT</div>
                <div className="text-sm text-muted">{tuitionPending} pending</div>
              </div>
              <div className="glass rounded-xl p-4 glow-orange">
                <div className="text-muted text-sm mb-1">Net Available</div>
                <div className={`text-2xl font-bold ${netAvailable >= 0 ? 'text-emerald' : 'text-red'}`}>{netAvailable} BDT</div>
                <div className="text-sm text-muted">Income - Expenses</div>
              </div>
              <div className="glass rounded-xl p-4 glow-purple">
                <div className="text-muted text-sm mb-1">Current CGPA</div>
                <div className="text-2xl font-bold text-purple">{cgpa}</div>
                <div className="text-sm text-muted">Goal: 3.50</div>
              </div>
            </div>

            <div className="glass rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Pomodoro Timer</h2>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-6xl font-mono font-bold text-cyan">{pomodoroDisplay}</div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button onClick={startPomodoro} className="px-4 py-2 bg-emerald/20 text-emerald rounded-lg hover:bg-emerald/30">Start</button>
                    <button onClick={pausePomodoro} className="px-4 py-2 bg-orange/20 text-orange rounded-lg hover:bg-orange/30">Pause</button>
                    <button onClick={resetPomodoro} className="px-4 py-2 bg-red/20 text-red rounded-lg hover:bg-red/30">Reset</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Tag chapter..." className="flex-1" />
                    <select value={pomodoroMinutes} onChange={(e) => handlePomodoroMinutesChange(parseInt(e.target.value))}>
                      <option value={25}>25 min</option><option value={15}>15 min</option><option value={45}>45 min</option><option value={60}>60 min</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted mb-2">Sessions Today: {todayPomodoro.sessions}</div>
                  <div className="text-sm text-muted">Total Focus Time: {Math.floor(todayPomodoro.totalMinutes / 60)}h {todayPomodoro.totalMinutes % 60}m</div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Today&apos;s Schedule</h2>
                <button onClick={() => openModal('scheduleModal')} className="px-3 py-1 bg-cyan/20 text-cyan rounded-lg text-sm hover:bg-cyan/30">+ Add</button>
              </div>
              <div className="space-y-3">
                {todaySchedule.length === 0 ? <p className="text-muted">No schedule for today</p> : todaySchedule.map((item) => {
                  const [h, m] = item.time.split(':').map(Number); const it = new Date(); it.setHours(h, m, 0); const isPast = it < now;
                  return (<div key={item.id} className={`flex items-center gap-4 p-3 rounded-lg ${isPast ? 'bg-surface opacity-50' : 'bg-surface-hover'}`}>
                    <div className={`text-lg font-mono ${isPast ? 'text-muted' : 'text-cyan'}`}>{item.time}</div>
                    <div className="flex-1">{item.title}</div>
                    <button onClick={() => setSchedule((p) => p.filter((s) => s.id !== item.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button>
                  </div>);
                })}
              </div>
            </div>
          </section>
        )}

        {/* Academic Hub */}
        {activeSection === 'academic' && (
          <section>
            <h1 className="text-3xl font-bold mb-6 neon-text-purple">Academic Hub</h1>

            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Weekly Timetable</h2>
                <button onClick={() => openModal('classModal')} className="px-3 py-1 bg-purple/20 text-purple rounded-lg text-sm hover:bg-purple/30">+ Add Class</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-muted border-b border-border"><th className="p-3 text-left">Time</th>{TIMETABLE_DAYS.map((d) => <th key={d} className="p-3">{DAY_NAMES[d]}</th>)}</tr></thead>
                  <tbody>
                    {timeSlots.length === 0 ? <tr><td colSpan={8} className="p-4 text-center text-muted">No classes added</td></tr> : timeSlots.map((time) => (
                      <tr key={time} className="border-b border-border">
                        <td className="p-2 text-muted">{time}</td>
                        {TIMETABLE_DAYS.map((day) => { const cls = classes.find((c) => c.time === time && c.day === day); return (
                          <td key={day} className="p-2 text-center">{cls ? (<div className="glass rounded-lg p-2 text-xs"><div className="font-medium text-cyan">{cls.name}</div>{cls.room && <div className="text-muted">{cls.room}</div>}<button onClick={() => setClasses((p) => p.filter((c) => c.id !== cls.id))} className="text-red text-xs mt-1"><X className="w-3 h-3 inline" /></button></div>) : <span className="text-muted">-</span>}</td>
                        ); })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Exam Countdown</h2>
                <button onClick={() => openModal('examModal')} className="px-3 py-1 bg-red/20 text-red rounded-lg text-sm hover:bg-red/30">+ Add Exam</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.length === 0 ? <p className="text-muted">No upcoming exams</p> : [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((exam) => {
                  const daysLeft = Math.ceil((new Date(exam.date).getTime() - Date.now()) / 86400000);
                  const urgency = daysLeft <= 3 ? 'glow-red border-red' : daysLeft <= 7 ? 'glow-orange border-orange' : 'border-border';
                  const textColor = daysLeft <= 3 ? 'text-red' : daysLeft <= 7 ? 'text-orange' : 'text-cyan';
                  return (<div key={exam.id} className={`glass rounded-xl p-4 border ${urgency}`}>
                    <div className="flex justify-between items-start mb-2"><h3 className="font-semibold">{exam.subject}</h3><button onClick={() => setExams((p) => p.filter((e) => e.id !== exam.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button></div>
                    <div className={`text-2xl font-bold ${textColor} mb-1`}>{daysLeft} days</div>
                    <div className="text-sm text-muted">{new Date(exam.date).toLocaleDateString()}</div>
                    {exam.topics && <div className="text-xs text-muted mt-2">{exam.topics}</div>}
                  </div>);
                })}
              </div>
            </div>

            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Syllabus Tracker</h2>
                <button onClick={() => openModal('syllabusModal')} className="px-3 py-1 bg-emerald/20 text-emerald rounded-lg text-sm hover:bg-emerald/30">+ Add Topic</button>
              </div>
              <div className="space-y-3">
                {syllabus.length === 0 ? <p className="text-muted">No syllabus items</p> : syllabus.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 glass rounded-lg">
                    <div className="flex-1"><span className="font-medium">{item.subject}</span><span className="text-muted"> - {item.topic}</span></div>
                    <button onClick={() => cycleSyllabusStatus(item.id)} className={`px-3 py-1 rounded-full text-xs ${STATUS_COLORS[item.status]}`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('-', ' ')}</button>
                    <button onClick={() => setSyllabus((p) => p.filter((s) => s.id !== item.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">CGPA Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-3"><h3 className="font-medium">Completed Courses</h3><button onClick={() => openModal('courseModal')} className="px-3 py-1 bg-cyan/20 text-cyan rounded-lg text-sm hover:bg-cyan/30">+ Add Course</button></div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {courses.length === 0 ? <p className="text-muted">No courses added</p> : courses.map((course) => (
                      <div key={course.id} className="flex items-center gap-3 p-2 glass rounded-lg text-sm">
                        <div className="flex-1">{course.name}</div>
                        <div className="text-muted">{course.credits} cr</div>
                        <div className="text-cyan font-medium">{GRADE_LABELS[course.grade] || course.grade}</div>
                        <button onClick={() => setCourses((p) => p.filter((c) => c.id !== course.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-xl p-4">
                  <h3 className="font-medium mb-3">CGPA Summary</h3>
                  <div className="text-4xl font-bold text-purple mb-2">{cgpa}</div>
                  <div className="text-sm text-muted mb-4">Total Credits: {totalCredits}</div>
                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium mb-2">Goal Simulator</h4>
                    <div className="flex gap-2 mb-2">
                      <input ref={goalCGPARef} type="number" placeholder="Target CGPA" step="0.01" min="0" max="4" className="flex-1" />
                      <input ref={remainingCreditsRef} type="number" placeholder="Remaining Credits" className="flex-1" />
                    </div>
                    <button onClick={simulateGoal} className="w-full py-2 bg-purple/20 text-purple rounded-lg hover:bg-purple/30">Calculate Required GPA</button>
                    <div id="goalResult" className="mt-3 text-sm text-muted" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tuition Manager */}
        {activeSection === 'tuition' && (
          <section>
            <h1 className="text-3xl font-bold mb-6 neon-text-emerald">Tuition Manager</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-xl p-4"><div className="text-muted text-sm mb-1">Total Students</div><div className="text-2xl font-bold">{students.length}</div></div>
              <div className="glass rounded-xl p-4 glow-emerald"><div className="text-muted text-sm mb-1">Collected This Month</div><div className="text-2xl font-bold text-emerald">{tuitionCollected} BDT</div></div>
              <div className="glass rounded-xl p-4 glow-orange"><div className="text-muted text-sm mb-1">Pending</div><div className="text-2xl font-bold text-orange">{students.filter((s) => !s.paid).reduce((s, st) => s + st.fee, 0)} BDT</div></div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Students</h2><button onClick={() => openModal('studentModal')} className="px-3 py-1 bg-emerald/20 text-emerald rounded-lg text-sm hover:bg-emerald/30">+ Add Student</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.length === 0 ? <p className="text-muted">No students added</p> : students.map((student) => (
                  <div key={student.id} className={`glass rounded-xl p-4 ${student.paid ? 'glow-emerald' : 'glow-orange'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div><h3 className="font-semibold">{student.name}</h3><div className="text-sm text-muted">{student.subject || 'General'}</div><div className="flex flex-wrap gap-1 mt-1">{student.days.map((d) => <span key={d} className="px-2 py-0.5 bg-cyan/15 text-cyan text-xs rounded-full">{d.slice(0,3)}</span>)}</div></div>
                      <button onClick={() => setStudents((p) => p.filter((s) => s.id !== student.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="text-lg font-bold mb-3">{student.fee} BDT</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateAttendance(student.id, -1)} className="w-8 h-8 glass rounded-lg hover:bg-surface-hover flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm">{student.attendance} classes</span>
                        <button onClick={() => updateAttendance(student.id, 1)} className="w-8 h-8 glass rounded-lg hover:bg-surface-hover flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => togglePayment(student.id)} className={`px-3 py-1 rounded-full text-sm ${student.paid ? 'bg-emerald/20 text-emerald' : 'bg-orange/20 text-orange'}`}>{student.paid ? 'Paid' : 'Pending'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Budget Tracker */}
        {activeSection === 'budget' && (
          <section>
            <h1 className="text-3xl font-bold mb-6 neon-text-orange">Budget Tracker</h1>
            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Monthly Budget</h2><div className="flex gap-2"><input ref={monthlyBudgetRef} type="number" placeholder="Set budget..." className="w-40" defaultValue={budget} onBlur={saveBudget} /><span className="text-muted self-center">BDT</span></div></div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2"><span>Spent: {totalSpent} BDT</span><span>Remaining: {budgetRemaining} BDT</span></div>
                <div className={`h-4 bg-surface rounded-full overflow-hidden ${budgetPercent >= 80 ? 'glow-red' : ''}`}>
                  <div className={`h-full rounded-full transition-all duration-500 ${budgetPercent >= 80 ? 'bg-gradient-to-r from-orange to-red' : 'bg-gradient-to-r from-emerald to-cyan'}`} style={{ width: `${budgetPercent}%` }} />
                </div>
                <div className="text-right text-sm text-muted mt-1">{budgetPercent.toFixed(0)}% used</div>
              </div>
            </div>
            <div className="glass rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Quick Add Expense</h2>
              <div className="flex flex-wrap gap-3">
                <input ref={expenseAmountRef} type="number" placeholder="Amount" className="w-32" />
                <input ref={expenseNoteRef} type="text" placeholder="Note (optional)" className="flex-1 min-w-48" />
                <select ref={expenseCategoryRef} className="w-40" defaultValue="food"><option value="food">Food</option><option value="transport">Transport</option><option value="education">Education</option><option value="entertainment">Entertainment</option><option value="utilities">Utilities</option><option value="other">Other</option></select>
                <button onClick={addExpense} className="px-4 py-2 bg-orange/20 text-orange rounded-lg hover:bg-orange/30">Add</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Category Breakdown</h2>
                <div className="space-y-3">
                  {Object.keys(categoryBreakdown).length === 0 ? <p className="text-muted">No expenses yet</p> : Object.entries(categoryBreakdown).map(([cat, amount]) => {
                    const pct = categoryTotal > 0 ? ((amount / categoryTotal) * 100).toFixed(0) : '0';
                    return (<div key={cat}><div className="flex justify-between text-sm mb-1"><span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span><span>{amount} BDT ({pct}%)</span></div><div className="h-2 bg-surface rounded-full overflow-hidden"><div className={`h-full ${CATEGORY_COLORS_BG[cat] || 'bg-muted'} rounded-full`} style={{ width: `${pct}%` }} /></div></div>);
                  })}
                </div>
              </div>
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Net Available Balance</h2>
                <div className="text-center">
                  <div className="text-sm text-muted mb-2">Tuition Income - Expenses</div>
                  <div className={`text-4xl font-bold ${netAvailable >= 0 ? 'text-emerald' : 'text-red'}`}>{netAvailable} BDT</div>
                  <div className="text-sm text-muted mt-2">Tuition: {tuitionCollected} | Expenses: {netExpenses}</div>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">Expense History</h2><button onClick={() => { if (confirm('Clear all expenses?')) setExpenses([]); }} className="px-3 py-1 bg-red/20 text-red rounded-lg text-sm hover:bg-red/30">Clear All</button></div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {expenses.length === 0 ? <p className="text-muted">No expenses recorded</p> : [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map((exp) => (
                  <div key={exp.id} className="flex items-center gap-3 p-2 glass rounded-lg text-sm">
                    <div className="flex-1"><span className={CATEGORY_COLORS_TEXT[exp.category] || 'text-muted'}>{exp.category}</span>{exp.note && <span className="text-muted"> - {exp.note}</span>}</div>
                    <div className="font-medium">{exp.amount} BDT</div>
                    <button onClick={() => setExpenses((p) => p.filter((e) => e.id !== exp.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Entertainment Hub */}
        {activeSection === 'entertainment' && (
          <section>
            <h1 className="text-3xl font-bold mb-6 neon-text-cyan">Entertainment Hub</h1>
            <div className="flex gap-2 mb-6">
              <button className={`px-4 py-2 rounded-lg ${activeTab === 'watchlist' ? 'bg-cyan/20 text-cyan' : 'text-muted'}`} onClick={() => setActiveTab('watchlist')}>Watchlist</button>
              <button className={`px-4 py-2 rounded-lg ${activeTab === 'completed' ? 'bg-cyan/20 text-cyan' : 'text-muted'}`} onClick={() => setActiveTab('completed')}>Completed</button>
            </div>
            <div className="glass rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Add Media</h2>
              <div className="flex flex-wrap gap-3">
                <input ref={mediaTitleRef} type="text" placeholder="Title" className="flex-1 min-w-48" />
                <select ref={mediaTypeRef} className="w-32" defaultValue="movie"><option value="movie">Movie</option><option value="series">Series</option><option value="game">Game</option><option value="anime">Anime</option></select>
                <input ref={mediaGenreRef} type="text" placeholder="Genre" className="w-32" />
                <button onClick={addMedia} className="px-4 py-2 bg-cyan/20 text-cyan rounded-lg hover:bg-cyan/30">Add to Watchlist</button>
              </div>
            </div>
            {activeTab === 'watchlist' && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Watchlist</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlist.length === 0 ? <p className="text-muted">Your watchlist is empty</p> : watchlist.map((item) => (
                    <div key={item.id} className="glass rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2"><span className={`px-2 py-1 rounded-full text-xs ${TYPE_COLORS[item.type]}`}>{item.type}</span><button onClick={() => setWatchlist((p) => p.filter((w) => w.id !== item.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button></div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      {item.genre && <div className="text-sm text-muted mb-3">{item.genre}</div>}
                      <button onClick={() => openRatingModal(item.id)} className="w-full py-2 bg-emerald/20 text-emerald rounded-lg text-sm hover:bg-emerald/30">Mark Complete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'completed' && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Completed Archive</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.length === 0 ? <p className="text-muted">No completed items</p> : completed.map((item) => (
                    <div key={item.id} className="glass rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2"><span className={`px-2 py-1 rounded-full text-xs ${TYPE_COLORS[item.type]}`}>{item.type}</span><button onClick={() => setCompleted((p) => p.filter((c) => c.id !== item.id))} className="text-red hover:text-red/80"><X className="w-4 h-4" /></button></div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <div className="text-sm mb-2">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-4 h-4 inline ${i <= item.rating ? 'text-orange fill-orange' : 'text-muted'}`} />)}</div>
                      {item.review && <div className="text-sm text-muted italic">"{item.review}"</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          {activeModal === 'scheduleModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Add Schedule Item</h3>
              <div className="space-y-4">
                <input ref={scheduleTitleRef} type="text" placeholder="Title" className="w-full" />
                <input ref={scheduleTimeRef} type="time" className="w-full" />
                <div>
                  <div className="text-sm text-muted mb-2">Select Days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, i) => (
                      <label key={i} className={`px-3 py-1 rounded-lg text-sm cursor-pointer transition-all ${scheduleDays.includes(i) ? 'bg-cyan/20 text-cyan border border-cyan' : 'bg-white/5 text-muted border border-white/10'}`}>
                        <input type="checkbox" className="hidden" checked={scheduleDays.includes(i)} onChange={() => setScheduleDays((p) => p.includes(i) ? p.filter((d) => d !== i) : [...p, i])} />
                        {name.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={addSchedule} className="flex-1 py-2 bg-cyan/20 text-cyan rounded-lg hover:bg-cyan/30">Add</button></div>
              </div>
            </div>
          )}
          {activeModal === 'classModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Add Class</h3>
              <div className="space-y-4">
                <input ref={classNameRef} type="text" placeholder="Course Name" className="w-full" />
                <input ref={classRoomRef} type="text" placeholder="Room" className="w-full" />
                <input ref={classTimeRef} type="time" className="w-full" />
                <div>
                  <div className="text-sm text-muted mb-2">Select Days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, i) => (
                      <label key={i} className={`px-3 py-1 rounded-lg text-sm cursor-pointer transition-all ${classDays.includes(i) ? 'bg-purple/20 text-purple border border-purple' : 'bg-white/5 text-muted border border-white/10'}`}>
                        <input type="checkbox" className="hidden" checked={classDays.includes(i)} onChange={() => setClassDays((p) => p.includes(i) ? p.filter((d) => d !== i) : [...p, i])} />
                        {name.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={addClass} className="flex-1 py-2 bg-purple/20 text-purple rounded-lg hover:bg-purple/30">Add</button></div>
              </div>
            </div>
          )}
          {activeModal === 'examModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Add Exam</h3>
              <div className="space-y-4">
                <input ref={examSubjectRef} type="text" placeholder="Subject" className="w-full" />
                <input ref={examDateRef} type="date" className="w-full" />
                <input ref={examTopicsRef} type="text" placeholder="Topics to cover" className="w-full" />
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={addExam} className="flex-1 py-2 bg-red/20 text-red rounded-lg hover:bg-red/30">Add</button></div>
              </div>
            </div>
          )}
          {activeModal === 'syllabusModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Add Syllabus Topic</h3>
              <div className="space-y-4">
                <input ref={syllabusSubjectRef} type="text" placeholder="Subject" className="w-full" />
                <input ref={syllabusTopicRef} type="text" placeholder="Topic" className="w-full" />
                <select ref={syllabusStatusRef} className="w-full" defaultValue="pending"><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="done">Done</option></select>
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={addSyllabus} className="flex-1 py-2 bg-emerald/20 text-emerald rounded-lg hover:bg-emerald/30">Add</button></div>
              </div>
            </div>
          )}
          {activeModal === 'courseModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Add Course</h3>
              <div className="space-y-4">
                <input ref={courseNameRef} type="text" placeholder="Course Name" className="w-full" />
                <select ref={courseCreditsRef} className="w-full" defaultValue="3">
                  <option value="1">1 Credit</option><option value="2">2 Credits</option><option value="3">3 Credits</option><option value="4">4 Credits</option>
                </select>
                <select ref={courseGradeRef} className="w-full" defaultValue="4.0"><option value="4.0">A (4.0)</option><option value="3.7">A- (3.7)</option><option value="3.3">B+ (3.3)</option><option value="3.0">B (3.0)</option><option value="2.7">B- (2.7)</option><option value="2.3">C+ (2.3)</option><option value="2.0">C (2.0)</option><option value="1.7">C- (1.7)</option><option value="1.3">D+ (1.3)</option><option value="1.0">D (1.0)</option><option value="0">F (0.0)</option></select>
                <div className="text-xs text-muted">Weighted CGPA = Sum(Grade x Credits) / Total Credits</div>
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={addCourse} className="flex-1 py-2 bg-cyan/20 text-cyan rounded-lg hover:bg-cyan/30">Add</button></div>
              </div>
            </div>
          )}
          {activeModal === 'studentModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Add Student</h3>
              <div className="space-y-4">
                <input ref={studentNameRef} type="text" placeholder="Student Name" className="w-full" />
                <input ref={studentSubjectRef} type="text" placeholder="Subject" className="w-full" />
                <input ref={studentFeeRef} type="number" placeholder="Monthly Fee (BDT)" className="w-full" />
                <div>
                  <div className="text-sm text-muted mb-2">Select Days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name) => (
                      <label key={name} className={`px-3 py-1 rounded-lg text-sm cursor-pointer transition-all ${studentDays.includes(name) ? 'bg-emerald/20 text-emerald border border-emerald' : 'bg-white/5 text-muted border border-white/10'}`}>
                        <input type="checkbox" className="hidden" checked={studentDays.includes(name)} onChange={() => setStudentDays((p) => p.includes(name) ? p.filter((d) => d !== name) : [...p, name])} />
                        {name.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={addStudent} className="flex-1 py-2 bg-emerald/20 text-emerald rounded-lg hover:bg-emerald/30">Add</button></div>
              </div>
            </div>
          )}
          {activeModal === 'ratingModal' && (
            <div className="glass rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Rate & Complete</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex justify-center gap-2 mb-4">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-6 h-6 cursor-pointer ${i <= selectedRating ? 'text-orange fill-orange' : 'text-muted'}`} onClick={() => setSelectedRating(i)} />)}</div>
                  <div className="text-muted text-sm">Click to rate</div>
                </div>
                <textarea ref={ratingReviewRef} placeholder="Write a review (optional)" rows={3} className="w-full" />
                <div className="flex gap-3"><button onClick={closeModal} className="flex-1 py-2 bg-surface rounded-lg hover:bg-surface-hover">Cancel</button><button onClick={completeMedia} className="flex-1 py-2 bg-emerald/20 text-emerald rounded-lg hover:bg-emerald/30">Mark Complete</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setFabOpen(!fabOpen)} className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-cyan to-purple rounded-full shadow-lg flex items-center justify-center text-2xl font-bold hover:scale-110 transition-transform z-40"><Plus className="w-6 h-6" /></button>
      {fabOpen && (
        <div className="fixed bottom-24 right-6 flex flex-col gap-2 z-40">
          <button onClick={() => { openModal('scheduleModal'); setFabOpen(false); }} className="glass px-4 py-2 rounded-lg text-sm hover:bg-surface-hover">+ Schedule</button>
          <button onClick={() => { openModal('examModal'); setFabOpen(false); }} className="glass px-4 py-2 rounded-lg text-sm hover:bg-surface-hover">+ Exam</button>
          <button onClick={() => { openModal('studentModal'); setFabOpen(false); }} className="glass px-4 py-2 rounded-lg text-sm hover:bg-surface-hover">+ Student</button>
          <button onClick={() => { quickExpense(); setFabOpen(false); }} className="glass px-4 py-2 rounded-lg text-sm hover:bg-surface-hover">+ Expense</button>
        </div>
      )}
    </div>
  );
}

export default App;
