import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, Brain, CalendarDays, Check, CheckCircle2, Clock3, GraduationCap, MessageCircle, Plus, Sparkles, Target, Trophy, X } from "lucide-react";
import "./styles.css";

const API = "http://localhost:8000";
const defaultSubjects = [
  { name: "DSA", weak: false, done: 7, total: 12 },
  { name: "DBMS", weak: true, done: 4, total: 10 },
  { name: "Operating Systems", weak: false, done: 3, total: 8 }
];

function App() {
  const [subjects, setSubjects] = useState(() => JSON.parse(localStorage.getItem("friendstudy_subjects") || "null") || defaultSubjects);
  const [hours, setHours] = useState(() => Number(localStorage.getItem("friendstudy_hours") || 3));
  const [examDate, setExamDate] = useState(() => localStorage.getItem("friendstudy_exam") || "2026-10-22");
  const [showSetup, setShowSetup] = useState(false);
  const [mode, setMode] = useState("dashboard");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizSubject, setQuizSubject] = useState("DSA");
  const [quizTopic, setQuizTopic] = useState("binary search");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [streak, setStreak] = useState(() => Number(localStorage.getItem("friendstudy_streak") || 6));

  useEffect(() => localStorage.setItem("friendstudy_subjects", JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem("friendstudy_hours", hours), [hours]);
  useEffect(() => localStorage.setItem("friendstudy_exam", examDate), [examDate]);
  useEffect(() => localStorage.setItem("friendstudy_streak", streak), [streak]);

  const totalDone = subjects.reduce((a, s) => a + s.done, 0);
  const totalTopics = subjects.reduce((a, s) => a + s.total, 0);
  const progress = totalTopics ? Math.round((totalDone / totalTopics) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000));
  const weakSubjects = subjects.filter(s => s.weak).map(s => s.name).join(", ") || "none";

  function updateSubject(index, patch) {
    setSubjects(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s));
  }

  function markDone(index) {
    setSubjects(prev => prev.map((s, i) => i === index ? { ...s, done: Math.min(s.total, s.done + 1) } : s));
    setStreak(prev => prev + 1);
  }

  async function callAI(path, body) {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`server error: ${res.status}`);
    const data = await res.json();
    if (!data.answer) throw new Error("no answer received");
    return data.answer;
  }

  async function askAI() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    setMode("ask");
    try {
      const result = await callAI("/api/ask", { question: question.trim(), subjects, hours });
      setAnswer(result);
    } catch (error) {
      setAnswer(`ai error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    if (loading) return;
    setLoading(true);
    setAnswer("");
    setMode("plan");
    try {
      const result = await callAI("/api/plan", { subjects, hours, exam_date: examDate });
      setAnswer(result);
    } catch (error) {
      setAnswer(`ai error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz() {
    if (loading || !quizTopic.trim()) return;
    setLoading(true);
    setAnswer("");
    setMode("quiz");
    try {
      const result = await callAI("/api/quiz", { subject: quizSubject, topic: quizTopic.trim(), count: 5, difficulty: quizDifficulty });
      setAnswer(result);
    } catch (error) {
      setAnswer(`ai error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function nav(next) {
    setMode(next);
    if (next !== "ask" && next !== "plan" && next !== "quiz") setAnswer("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><Brain size={20}/></div><span>friendstudy<span className="dot">.</span>ai</span></div>
        <div className="profile-card"><div className="avatar">AK</div><div><strong>my study space</strong><span>exam mode</span></div></div>
        <nav>
          <button className={mode === "dashboard" ? "nav-active" : ""} onClick={() => nav("dashboard")}><Target size={18}/> Dashboard</button>
          <button className={mode === "plan" ? "nav-active" : ""} onClick={() => nav("plan")}><CalendarDays size={18}/> Study plan</button>
          <button className={mode === "ask" ? "nav-active" : ""} onClick={() => nav("ask")}><MessageCircle size={18}/> Ask AI</button>
          <button className={mode === "quiz" ? "nav-active" : ""} onClick={() => nav("quiz")}><BookOpen size={18}/> AI Quiz</button>
          <button className={mode === "progress" ? "nav-active" : ""} onClick={() => nav("progress")}><Trophy size={18}/> Progress</button>
        </nav>
        <div className="sidebar-bottom"><div className="open-badge"><Sparkles size={16}/><span>Powered by open-weight AI</span></div><button className="setup-btn" onClick={() => setShowSetup(true)}>Edit study setup</button></div>
      </aside>

      <main>
        <header className="topbar">
          <div><p className="eyebrow">your personal study companion</p><h1>good evening, arkendu 👋</h1><p className="muted">let's make today's {hours} hours count.</p></div>
          <button className="primary" onClick={() => setShowSetup(true)}>Customize plan</button>
        </header>

        <section className="stats">
          <Stat icon={<Target/>} cls="purple" label="overall progress" value={`${progress}%`}/>
          <Stat icon={<Clock3/>} cls="blue" label="today's goal" value={`${hours} hours`}/>
          <Stat icon={<CheckCircle2/>} cls="green" label="topics done" value={`${totalDone}/${totalTopics}`}/>
          <Stat icon={<Trophy/>} cls="orange" label="study streak" value={`${streak} days`}/>
        </section>

        {mode === "dashboard" && <Dashboard daysLeft={daysLeft} progress={progress} subjects={subjects} markDone={markDone} generatePlan={generatePlan} loading={loading} answer={answer} setMode={setMode} />}
        {mode === "plan" && <PlanView generatePlan={generatePlan} loading={loading} answer={answer} daysLeft={daysLeft} subjects={subjects}/>} 
        {mode === "ask" && <AskView question={question} setQuestion={setQuestion} askAI={askAI} loading={loading} answer={answer}/>} 
        {mode === "quiz" && <QuizView quizSubject={quizSubject} setQuizSubject={setQuizSubject} quizTopic={quizTopic} setQuizTopic={setQuizTopic} quizDifficulty={quizDifficulty} setQuizDifficulty={setQuizDifficulty} generateQuiz={generateQuiz} loading={loading} answer={answer} subjects={subjects}/>} 
        {mode === "progress" && <ProgressView subjects={subjects} progress={progress} totalDone={totalDone} totalTopics={totalTopics} daysLeft={daysLeft}/>} 
      </main>

      {showSetup && <div className="modal-wrap"><div className="modal">
        <button className="close" onClick={() => setShowSetup(false)}><X/></button>
        <p className="eyebrow">personalize it</p><h2>study setup</h2>
        <label>exam date<input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}/></label>
        <label>daily study hours<input type="number" min="1" max="12" value={hours} onChange={e => setHours(Math.max(1, Math.min(12, Number(e.target.value))))}/></label>
        <label>subjects</label>
        {subjects.map((s, i) => <div className="subject-edit" key={`${s.name}-${i}`}><input value={s.name} onChange={e => updateSubject(i, { name: e.target.value })}/><button className={s.weak ? "weak-on" : ""} onClick={() => updateSubject(i, { weak: !s.weak })}>{s.weak ? "weak" : "normal"}</button></div>)}
        <button className="secondary full" onClick={() => setSubjects(prev => [...prev, { name: `Subject ${prev.length + 1}`, weak: false, done: 0, total: 10 }])}><Plus size={15}/> add subject</button>
        <button className="primary full" onClick={() => setShowSetup(false)}>save setup</button>
      </div></div>}
    </div>
  );
}

function Stat({icon, cls, label, value}) { return <div className="stat"><div className={`stat-icon ${cls}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }

function Dashboard({daysLeft, progress, subjects, markDone, generatePlan, loading, answer, setMode}) {
  return <>
    <section className="hero-grid"><div className="countdown"><div><p className="eyebrow">exam countdown</p><h2>{daysLeft} days left</h2><p>stay consistent and let the plan adapt to your weak subjects.</p></div><div className="ring"><strong>{progress}%</strong><span>ready</span></div></div><div className="focus-card"><p className="eyebrow">today's focus</p><h3>{subjects.find(s => s.weak)?.name || "your weakest subject"}</h3><p>start with the topic that needs the most attention.</p><button className="ghost" onClick={() => setMode("plan")}>open plan</button></div></section>
    <section className="grid"><div className="panel"><div className="panel-head"><div><p className="eyebrow">today</p><h2>your study plan</h2></div><button className="ghost" onClick={generatePlan}><Sparkles size={16}/> generate with ai</button></div><div className="plan-list"><PlanItem time="60 min" title="weak subject deep work" type="priority" onDone={() => markDone(1)}/><PlanItem time="60 min" title="DSA — binary search" type="practice" onDone={() => markDone(0)}/><PlanItem time="45 min" title="Operating Systems — processes" type="revision" onDone={() => markDone(2)}/><PlanItem time="15 min" title="quick revision quiz" type="ai quiz"/></div>{loading && <AIStatus/>}{answer && <AIOutput answer={answer}/>}</div><SubjectPanel subjects={subjects}/></section>
    <section className="ai-card"><div className="ai-card-copy"><div className="ai-logo"><Sparkles/></div><div><p className="eyebrow">learn faster</p><h2>ask ai anything</h2><p>get simple explanations, examples, study plans and practice questions.</p></div></div><button className="primary" onClick={() => setMode("ask")}>open ask ai <Sparkles size={16}/></button></section>
  </>;
}

function PlanView({generatePlan, loading, answer, daysLeft, subjects}) { return <section className="content-stack"><div className="section-banner"><div><p className="eyebrow">adaptive planning</p><h2>your ai study plan</h2><p>your exam is in {daysLeft} days. weak subjects: {subjects.filter(s => s.weak).map(s => s.name).join(", ") || "none"}.</p></div><button className="primary" onClick={generatePlan}><Sparkles size={16}/> {loading ? "generating..." : "generate plan"}</button></div><div className="panel"><div className="plan-list"><PlanItem time="priority" title="weak subject deep work" type="AI selected"/><PlanItem time="practice" title="DSA problem solving" type="active recall"/><PlanItem time="revision" title="review yesterday's notes" type="spaced repetition"/><PlanItem time="15 min" title="quick quiz" type="retrieval practice"/></div>{loading && <AIStatus/>}{answer && <AIOutput answer={answer}/>}</div></section>; }

function AskView({question, setQuestion, askAI, loading, answer}) { return <section className="content-stack"><div className="section-banner"><div><p className="eyebrow">study companion</p><h2>ask your local ai</h2><p>powered by qwen2.5:3b through ollama on your machine.</p></div></div><div className="panel ask-panel"><div className="suggestions"><button onClick={() => setQuestion("explain binary search in simple words")}>explain a topic</button><button onClick={() => setQuestion("give me a practice problem for linked lists")}>practice problem</button><button onClick={() => setQuestion("make a quick revision checklist for dbms")}>revision checklist</button></div><div className="ask-row"><input autoFocus value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()} placeholder="e.g. explain binary search like i'm a beginner"/><button className="primary" onClick={askAI}>{loading ? "thinking..." : "ask ai"} <Sparkles size={16}/></button></div>{loading && <AIStatus/>}{answer && <AIOutput answer={answer}/>}</div></section>; }

function QuizView({quizSubject, setQuizSubject, quizTopic, setQuizTopic, quizDifficulty, setQuizDifficulty, generateQuiz, loading, answer, subjects}) { return <section className="content-stack"><div className="section-banner"><div><p className="eyebrow">active recall</p><h2>ai quiz generator</h2><p>generate five questions from your selected topic.</p></div></div><div className="panel"><div className="quiz-controls"><select value={quizSubject} onChange={e => setQuizSubject(e.target.value)}>{subjects.map(s => <option key={s.name}>{s.name}</option>)}</select><input value={quizTopic} onChange={e => setQuizTopic(e.target.value)} placeholder="topic e.g. normalization"/><select value={quizDifficulty} onChange={e => setQuizDifficulty(e.target.value)}><option>easy</option><option>medium</option><option>hard</option></select><button className="primary" onClick={generateQuiz}><BookOpen size={16}/> {loading ? "generating..." : "generate quiz"}</button></div>{loading && <AIStatus/>}{answer && <AIOutput answer={answer}/>}</div></section>; }

function ProgressView({subjects, progress, totalDone, totalTopics, daysLeft}) { return <section className="content-stack"><div className="section-banner"><div><p className="eyebrow">your growth</p><h2>progress dashboard</h2><p>{totalDone} of {totalTopics} tracked topics completed with {daysLeft} days until the exam.</p></div><div className="big-progress">{progress}%</div></div><div className="progress-grid">{subjects.map(s => <div className="progress-card" key={s.name}><div className="subject-top"><strong>{s.name}</strong><span>{s.done}/{s.total}</span></div><div className="bar"><i style={{width: `${Math.round((s.done / s.total) * 100)}%`}}/></div><small>{s.weak ? "priority subject" : "on track"}</small></div>)}</div></section>; }

function PlanItem({time, title, type, onDone}) { return <div className="plan-item"><button className="check" onClick={onDone || (() => {})}><Check size={17}/></button><div className="plan-title"><strong>{title}</strong><span>{type}</span></div><time>{time}</time></div>; }
function SubjectPanel({subjects}) { return <div className="panel"><div className="panel-head"><div><p className="eyebrow">subjects</p><h2>your progress</h2></div></div>{subjects.map(s => <Subject key={s.name} subject={s}/>)}<div className="friend-note"><GraduationCap size={20}/><div><strong>built for a real friend</strong><span>personalized around weak topics and exam date.</span></div></div></div>; }
function Subject({subject}) { const pct = Math.round((subject.done / subject.total) * 100); return <div className="subject"><div className="subject-top"><div><strong>{subject.name}</strong>{subject.weak && <span className="weak">weak topic</span>}</div><span>{subject.done}/{subject.total}</span></div><div className="bar"><i style={{width: `${pct}%`}}/></div></div>; }
function AIStatus() { return <div className="ai-status"><Sparkles size={16}/> thinking with your local ai...</div>; }
function AIOutput({answer}) { return <div className="ai-output"><div className="ai-title"><Sparkles size={16}/> ai response</div><pre>{answer}</pre></div>; }

createRoot(document.getElementById("root")).render(<App />);
