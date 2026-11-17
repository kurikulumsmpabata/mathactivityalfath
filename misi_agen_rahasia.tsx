import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, ShieldCheck, Lock, Unlock, ChevronRight, RefreshCcw, Activity, Users, UserCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
// Menggunakan environment variables dari platform
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- DATA SOAL ---
const QUESTIONS = [
  {
    id: 1,
    question: "Sandi Masuk: {(1,A), (2,B), (3,B), (4,C)} - Apakah himpunan pasangan berurutan ini merupakan Fungsi?",
    options: ["Ya", "Bukan"],
    answer: "Ya",
    explanation: "Setiap angka (domain) 1,2,3,4 hanya muncul tepat satu kali di depan."
  },
  {
    id: 2,
    question: "Diagram panah menunjukkan SATU input agen bercabang ke DUA senjata berbeda. Apakah relasi ini Fungsi?",
    options: ["Ya", "Bukan"],
    answer: "Bukan",
    explanation: "Fungsi tidak boleh memiliki input yang bercabang (memiliki lebih dari satu pasangan)."
  },
  {
    id: 3,
    question: "Pola algoritma: Input 1->4, 2->7, 3->10. Apa rumus fungsinya?",
    options: ["f(x)=3x+1", "f(x)=2x+2", "f(x)=4x"],
    answer: "f(x)=3x+1",
    explanation: "Jika x=1, 3(1)+1 = 4. Jika x=2, 3(2)+1 = 7."
  },
  {
    id: 4,
    question: "Tabel data: x = {-2, -1, 0, 1} menghasilkan output f(x) = {-4, -2, 0, 2}. Apa rumus fungsinya?",
    options: ["f(x)=2x", "f(x)=-2x", "f(x)=x+2"],
    answer: "f(x)=2x",
    explanation: "Setiap nilai x dikalikan 2 menghasilkan nilai f(x)."
  },
  {
    id: 5,
    question: "Pelacak menggunakan fungsi f(x)=4x-7. Berapa nilai koordinat f(5)?",
    options: ["13", "10", "15"],
    answer: "13",
    explanation: "f(5) = 4(5) - 7 = 20 - 7 = 13."
  },
  {
    id: 6,
    question: "Kode brankas: f(x)=-3x+10. Jika hasil layar f(a)=-5, berapakah nilai a?",
    options: ["5", "-5", "10"],
    answer: "5",
    explanation: "-3a + 10 = -5  ->  -3a = -15  ->  a = 5."
  },
  {
    id: 7,
    question: "Evakuasi helikopter: Tarif dasar 150rb + 50rb/km. Jarak penjemputan 12km. Berapa Total biayanya?",
    options: ["750rb", "650rb", "800rb"],
    answer: "750rb",
    explanation: "Total = 150.000 + (12 * 50.000) = 150.000 + 600.000 = 750.000."
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('role_selection'); // role_selection, student_login, playing, result, teacher_dashboard
  const [studentName, setStudentName] = useState('');
  
  // Game State
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [answersRecord, setAnswersRecord] = useState([]);

  // Authentication Effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleStartGame = (name) => {
    setStudentName(name);
    setView('playing');
    setCurrentQ(0);
    setScore(0);
    setFeedback(null);
    setAnswersRecord([]);
  };

  const handleAnswer = (selectedOption) => {
    const isCorrect = selectedOption === QUESTIONS[currentQ].answer;
    
    if (isCorrect) {
      setScore(prev => prev + 100);
    }

    setAnswersRecord(prev => {
      const newRecord = [...prev];
      newRecord[currentQ] = isCorrect;
      return newRecord;
    });

    setFeedback({
      isCorrect,
      message: isCorrect ? QUESTIONS[currentQ].explanation : `SALAH! Jawaban yang benar: ${QUESTIONS[currentQ].answer}`
    });
  };

  const nextQuestion = async () => {
    setFeedback(null);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      setView('result');
      // Save to Firebase when game ends
      if (user && studentName) {
        try {
          const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'scores');
          await addDoc(scoresRef, {
            name: studentName,
            score: score, 
            answers: answersRecord,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error("Error saving score:", error);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-mono text-green-500 selection:bg-green-500 selection:text-black">
      <div className="w-full max-w-3xl h-[750px] max-h-[95vh] bg-black rounded-lg border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] relative overflow-hidden flex flex-col">
        
        {/* Terminal Header */}
        <div className="bg-green-950/80 border-b border-green-500 p-3 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Terminal size={18} />
            <span className="font-bold tracking-widest">AGENCY_OS_v9.9</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="animate-pulse flex items-center gap-2 text-green-400">
              <Activity size={16} /> {user ? 'SECURE_LINK_ACTIVE' : 'CONNECTING...'}
            </span>
            <button onClick={() => setView('role_selection')} className="hover:text-white underline decoration-green-500 underline-offset-4">
              [ LOGOUT ]
            </button>
          </div>
        </div>

        {/* Screens */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto relative bg-gradient-to-b from-green-950/20 to-black">
          {view === 'role_selection' && <RoleSelectionScreen setView={setView} />}
          {view === 'student_login' && <StudentLoginScreen onStart={handleStartGame} setView={setView} />}
          {view === 'teacher_login' && <TeacherLoginScreen setView={setView} />}
          {view === 'playing' && (
            <QuizScreen 
              question={QUESTIONS[currentQ]} 
              currentQ={currentQ} 
              totalQ={QUESTIONS.length}
              score={score}
              onAnswer={handleAnswer} 
            />
          )}
          {view === 'result' && <ResultScreen score={score} total={QUESTIONS.length * 100} onRestart={() => setView('role_selection')} />}
          {view === 'teacher_dashboard' && <TeacherDashboard user={user} appId={appId} />}
        </div>

        {/* Feedback Modal Overlay */}
        {feedback && (
          <FeedbackModal feedback={feedback} onNext={nextQuestion} />
        )}
      </div>
    </div>
  );
}

// --- SCREENS ---

function RoleSelectionScreen({ setView }) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleTeacherSubmit = (e) => {
    e.preventDefault();
    if (password === 'KOMANDAN123') {
      setView('teacher_dashboard');
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (showPasswordPrompt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <form onSubmit={handleTeacherSubmit} className="w-full max-w-sm p-8 border border-green-500 bg-black shadow-[0_0_30px_rgba(34,197,94,0.1)]">
          <div className="mb-6 text-center">
            <Lock size={48} className="mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold tracking-widest text-white">OTORISASI KOMANDAN</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-green-400/80 mb-2">KODE SANDI:</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className={`w-full bg-green-950/30 border ${error ? 'border-red-500' : 'border-green-600'} p-3 text-green-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 font-mono`}
                placeholder="Masukkan sandi..."
                required
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2 animate-pulse">Sandi salah. Akses ditolak.</p>}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button 
                type="button"
                onClick={() => { setShowPasswordPrompt(false); setError(false); setPassword(''); }}
                className="flex-1 py-3 border border-green-500 text-green-500 font-bold tracking-widest hover:bg-green-950 transition-colors"
              >
                [ BATAL ]
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-green-500 text-black font-bold tracking-widest hover:bg-green-400 transition-colors"
              >
                [ MASUK ]
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-500">
      <div className="text-center">
        <ShieldAlert size={80} className="text-green-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
        <h1 className="text-4xl font-bold tracking-widest mb-2 text-white">SYSTEM <span className="text-green-500">LOGIN</span></h1>
        <p className="text-green-400/60">Pilih tingkat otorisasi Anda</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
        <button 
          onClick={() => setView('student_login')}
          className="flex-1 group p-6 border-2 border-green-500 bg-green-950/20 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center gap-3"
        >
          <UserCircle size={40} className="group-hover:animate-bounce" />
          <span className="font-bold tracking-widest text-lg">AGEN FIELD</span>
          <span className="text-xs opacity-70">(Siswa / Kelompok)</span>
        </button>

        <button 
          onClick={() => setShowPasswordPrompt(true)}
          className="flex-1 group p-6 border-2 border-green-500 bg-green-950/20 hover:bg-green-500 hover:text-black transition-all flex flex-col items-center gap-3"
        >
          <Users size={40} className="group-hover:animate-bounce" />
          <span className="font-bold tracking-widest text-lg">KOMANDAN</span>
          <span className="text-xs opacity-70">(Guru)</span>
        </button>
      </div>
    </div>
  );
}

function StudentLoginScreen({ onStart }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 border border-green-500 bg-black shadow-[0_0_30px_rgba(34,197,94,0.1)]">
        <div className="mb-8 text-center">
          <Lock size={48} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold tracking-widest">OTENTIKASI AGEN</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-green-400/80 mb-2">IDENTITAS (NAMA KELOMPOK):</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-green-950/30 border border-green-600 p-3 text-green-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 font-mono uppercase"
              placeholder="Masukkan nama kelompok..."
              required
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-green-500 text-black font-bold tracking-widest hover:bg-green-400 transition-colors flex justify-center items-center gap-2"
          >
            [ MULAI MISI ] <ChevronRight size={18} />
          </button>

          <button 
            type="button"
            onClick={() => setView('role_selection')}
            className="w-full py-2 text-green-500 font-bold tracking-widest hover:text-green-400 transition-colors text-sm"
          >
            [ KEMBALI ]
          </button>
        </div>
      </form>
    </div>
  );
}

function TeacherLoginScreen({ setView }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'KOMANDAN123') {
      setView('teacher_dashboard');
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 border border-green-500 bg-black shadow-[0_0_30px_rgba(34,197,94,0.1)]">
        <div className="mb-8 text-center">
          <Lock size={48} className="mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold tracking-widest">OTENTIKASI KOMANDAN</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-green-400/80 mb-2">KODE SANDI:</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              className={`w-full bg-green-950/30 border ${error ? 'border-red-500' : 'border-green-600'} p-3 text-green-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 font-mono`}
              placeholder="Masukkan sandi..."
              required
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 animate-pulse">AKSES DITOLAK: Sandi salah.</p>}
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-green-500 text-black font-bold tracking-widest hover:bg-green-400 transition-colors flex justify-center items-center gap-2"
          >
            [ LOGIN ] <ChevronRight size={18} />
          </button>
          
          <button 
            type="button"
            onClick={() => setView('role_selection')}
            className="w-full py-2 text-green-500 font-bold tracking-widest hover:text-green-400 transition-colors text-sm"
          >
            [ KEMBALI ]
          </button>
        </div>
      </form>
    </div>
  );
}

function QuizScreen({ question, currentQ, totalQ, score, onAnswer }) {
  return (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-300 h-full">
      <div className="flex justify-between items-end border-b border-green-500/50 pb-4 mb-8">
        <div>
          <div className="text-green-400/60 text-xs mb-1">PROGRES: {currentQ + 1} / {totalQ}</div>
          <h2 className="text-xl font-bold tracking-widest text-white">
            &gt; DEKRIPSI TAHAP {currentQ + 1}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-green-400/60 text-xs mb-1">SKOR MISI</div>
          <div className="text-2xl font-bold text-green-400">{score}</div>
        </div>
      </div>

      <div className="mb-8 flex-1">
        <p className="text-lg sm:text-2xl leading-relaxed whitespace-pre-wrap font-medium">
          {question.question}
        </p>
      </div>

      <div className="grid gap-4 mt-auto">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAnswer(opt)}
            className="w-full text-left p-4 border border-green-700 bg-green-950/40 hover:bg-green-500 hover:text-black hover:border-green-400 transition-all group flex items-center justify-between font-bold text-lg"
          >
            <span><span className="text-green-600 group-hover:text-black mr-4 opacity-70">[{i + 1}]</span> {opt}</span>
            <span className="opacity-0 group-hover:opacity-100">&lt;SELECT&gt;</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultScreen({ score, total, onRestart }) {
  const isPerfect = score === total;
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="mb-2">
        {isPerfect ? <ShieldCheck size={100} className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,1)]" /> : <ShieldAlert size={100} className="text-yellow-500" />}
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-2 tracking-widest">MISI SELESAI</h2>
        <div className="text-5xl font-black mb-2 text-white">
          {score} <span className="text-2xl text-green-500">/ {total}</span>
        </div>
        <p className="text-green-400/80">Data skor telah dikirim ke markas pusat (Monitor Komandan).</p>
      </div>

      <button 
        onClick={onRestart}
        className="mt-8 px-8 py-3 border-2 border-green-500 hover:bg-green-500 hover:text-black transition-colors flex items-center gap-3 font-bold tracking-widest"
      >
        <RefreshCcw size={18} />
        [ KEMBALI KE MENU ]
      </button>
    </div>
  );
}

function TeacherDashboard({ user, appId }) {
  const [scoresData, setScoresData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Listen to real-time updates from Firestore
    const scoresRef = collection(db, 'artifacts', appId, 'public', 'data', 'scores');
    const unsubscribe = onSnapshot(scoresRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by score (desc), then by timestamp (desc)
      data.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
      setScoresData(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scores:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, appId]);

  return (
    <div className="flex-1 flex flex-col animate-in fade-in duration-500 h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-6 border-b border-green-500/50 pb-4 shrink-0">
        <Users size={28} className="text-green-400" />
        <div>
          <h2 className="text-2xl font-bold tracking-widest text-white">MONITOR KOMANDAN</h2>
          <p className="text-xs text-green-400/60">Live Tracking Data Agen - Klasifikasi Rahasia</p>
        </div>
      </div>

      <div className="flex-1 bg-black border border-green-800 rounded flex flex-col overflow-hidden min-h-0">
        {/* Table Header */}
        <div className="flex gap-4 p-4 bg-green-950/80 border-b border-green-800 text-xs font-bold tracking-widest text-green-400 shrink-0">
          <div className="w-8 shrink-0">#</div>
          <div className="flex-1 min-w-[100px]">NAMA KELOMPOK</div>
          <div className="flex gap-1 shrink-0">
            {['Q1','Q2','Q3','Q4','Q5','Q6','Q7'].map(q => (
              <div key={q} className="w-6 text-center">{q}</div>
            ))}
          </div>
          <div className="w-12 text-right shrink-0">SKOR</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="text-center p-8 animate-pulse text-green-600 font-bold">MENGAMBIL DATA SATELIT...</div>
          ) : scoresData.length === 0 ? (
            <div className="text-center p-8 text-green-600/50">BELUM ADA DATA AGEN MASUK</div>
          ) : (
            scoresData.map((data, index) => (
              <div key={data.id} className="flex gap-4 p-3 bg-green-950/30 hover:bg-green-900/50 border border-transparent hover:border-green-800 transition-colors items-center text-sm sm:text-base">
                <div className="w-8 shrink-0 text-green-600 font-bold">{index + 1}</div>
                <div className="flex-1 min-w-[100px] font-bold text-white uppercase truncate">{data.name}</div>
                <div className="flex gap-1 shrink-0">
                  {Array.from({ length: 7 }).map((_, i) => {
                     const isAnswered = data.answers && data.answers.length > i;
                     const isCorrect = isAnswered ? data.answers[i] : null;
                     return (
                       <div key={i} className="w-6 text-center text-[10px] sm:text-xs">
                         {isAnswered ? (isCorrect ? '✅' : '❌') : '-'}
                       </div>
                     );
                  })}
                </div>
                <div className="w-12 text-right text-green-400 font-black shrink-0">{data.score}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({ feedback, onNext }) {
  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className={`w-full max-w-lg border-2 p-8 flex flex-col items-center text-center ${feedback.isCorrect ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
        
        <div className="mb-6">
          {feedback.isCorrect ? (
            <Unlock size={64} className="text-green-500 animate-pulse" />
          ) : (
            <Lock size={64} className="text-red-500 animate-pulse" />
          )}
        </div>
        
        <h3 className={`text-3xl font-black tracking-widest mb-4 ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {feedback.isCorrect ? 'AKSES DITERIMA' : 'AKSES DITOLAK'}
        </h3>
        
        <p className="text-lg mb-8 leading-relaxed font-sans bg-black p-4 border border-dashed border-gray-700 w-full text-gray-300">
          {feedback.message}
        </p>
        
        <button 
          onClick={onNext}
          className={`py-4 px-12 font-bold tracking-widest text-lg transition-all hover:scale-105
            ${feedback.isCorrect 
              ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
              : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
        >
          [ LANJUTKAN ]
        </button>
      </div>
    </div>
  );
}