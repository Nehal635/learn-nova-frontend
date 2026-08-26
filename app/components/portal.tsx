"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { request, sessionRequest } from "@/app/lib/api";
import type {
  AiInsight,
  Attempt,
  AttemptResult,
  QuizDetail,
  QuizSummary,
  StudentDashboard,
  StudentSummary,
  User,
} from "@/app/lib/types";
import { Icons } from "./icons";

type PortalSection = "overview" | "quizzes" | "history" | "students" | "users" | "manage";

function number(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getRecommendation(item: Attempt["recommendations"][number]) {
  return typeof item === "string" ? item : item.recommendation ?? `Practise ${item.topic ?? "this topic"}.`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function LoadingPanel({ label = "Loading your learning space…" }: { label?: string }) {
  return (
    <div className="loading-panel" aria-live="polite">
      <span className="spinner" />
      <p>{label}</p>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <span><Icons.book /></span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ScoreRing({ value, label = "Score" }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="score-ring" style={{ "--score": `${safe * 3.6}deg` } as CSSProperties}>
      <div>
        <strong>{Math.round(safe)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function StudentOverview({ user, onBrowse }: { user: User; onBrowse: () => void }) {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      request<StudentDashboard>("auth/me/dashboard"),
      request<QuizSummary[]>("quizzes"),
      request<Attempt[]>("auth/me/attempts"),
      request<AiInsight>("auth/me/ai-insights").catch(() => null),
    ])
      .then(([dashboardData, quizData, attemptData, insightData]) => {
        if (!active) return;
        setDashboard(dashboardData);
        setQuizzes(quizData);
        setAttempts(attemptData);
        setInsight(insightData);
      })
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : "Could not load the dashboard."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingPanel />;

  const totalAttempts = number(dashboard?.performance?.total_attempts, attempts.length);
  const average = number(
    dashboard?.performance?.average_score_percentage,
    attempts.length ? attempts.reduce((sum, attempt) => sum + attempt.score_percentage, 0) / attempts.length : 0,
  );
  const highest = number(
    dashboard?.performance?.highest_score_percentage,
    attempts.length ? Math.max(...attempts.map((attempt) => attempt.score_percentage)) : 0,
  );
  const latest = dashboard?.latest_attempt ?? attempts[0];

  return (
    <div className="view-stack">
      {error && <div className="notice notice-error">{error}</div>}
      <section className="welcome-banner">
        <div>
          <span className="eyebrow eyebrow-light">Your learning snapshot</span>
          <h2>Good to see you, {user.name.split(" ")[0]}.</h2>
          <p>{latest ? "Your progress is moving. Keep the momentum going with one focused quiz." : "Start with a short quiz and turn your first result into a clear learning plan."}</p>
          <button className="button button-lime" onClick={onBrowse}>
            Browse quizzes <Icons.arrow />
          </button>
        </div>
        <div className="banner-orbit" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="banner-spark"><Icons.spark /></span>
        </div>
      </section>

      <section className="metric-grid" aria-label="Performance summary">
        <article className="metric-card">
          <span className="metric-icon indigo"><Icons.quiz /></span>
          <div><span>Quiz attempts</span><strong>{totalAttempts}</strong><small>Completed assessments</small></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon lime"><Icons.chart /></span>
          <div><span>Average score</span><strong>{Math.round(average)}%</strong><small>Across all attempts</small></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon coral"><Icons.spark /></span>
          <div><span>Personal best</span><strong>{Math.round(highest)}%</strong><small>Your highest result</small></div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel latest-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Latest result</span><h3>Most recent assessment</h3></div>
            {latest && <span className="level-pill">{latest.learning_level}</span>}
          </div>
          {latest ? (
            <div className="latest-result">
              <ScoreRing value={latest.score_percentage} />
              <div className="result-copy">
                <p>{latest.correct_answers} of {latest.attempted_questions} answers correct</p>
                <div className="topic-row">
                  {latest.strong_topics?.slice(0, 3).map((topic) => <span className="topic-chip strong" key={topic}>{topic}</span>)}
                  {latest.weak_topics?.slice(0, 2).map((topic) => <span className="topic-chip weak" key={topic}>{topic}</span>)}
                </div>
                <small>Completed {formatDate(latest.created_at)}</small>
              </div>
            </div>
          ) : (
            <EmptyState title="No attempts yet" text="Your latest score and topic insights will appear here." />
          )}
        </article>

        <article className="panel recommendation-panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Next best step</span><h3>Recommended for you</h3></div>
            <span className="metric-icon lime"><Icons.spark /></span>
          </div>
          {latest?.recommendations?.length ? (
            <ul className="recommendation-list">
              {latest.recommendations.slice(0, 3).map((item, index) => (
                <li key={`${getRecommendation(item)}-${index}`}><span>{index + 1}</span><p>{getRecommendation(item)}</p></li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">Complete a quiz to receive a focused recommendation based on your result.</p>
          )}
        </article>
      </section>

      <section className={`panel ai-insight-panel risk-${insight?.risk_level ?? "unknown"}`}>
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Experimental AI forecast</span>
            <h3>Next-performance outlook</h3>
          </div>
          <span className={`confidence-pill confidence-${insight?.confidence ?? "none"}`}>
            {insight ? `${insight.confidence} confidence` : "unavailable"}
          </span>
        </div>
        {insight ? (
          <div className="ai-insight-grid">
            <div className="ai-score">
              <strong>
                {insight.predicted_next_score == null
                  ? "—"
                  : `${Math.round(insight.predicted_next_score)}%`}
              </strong>
              <span>Predicted next score</span>
            </div>
            <div className="ai-facts">
              <div>
                <span>Risk level</span>
                <strong>{insight.risk_level}</strong>
              </div>
              <div>
                <span>Suggested difficulty</span>
                <strong>{insight.recommended_difficulty}</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>
                  {insight.method === "random_forest"
                    ? "Random Forest"
                    : insight.method === "trend_fallback"
                      ? "Recent trend"
                      : "Waiting for attempts"}
                </strong>
              </div>
            </div>
            <p className="ai-explanation">{insight.explanation}</p>
          </div>
        ) : (
          <p className="muted-copy">
            AI insight is temporarily unavailable. Your quiz and progress data are still working normally.
          </p>
        )}
      </section>

      <section className="panel available-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Ready when you are</span><h3>Available assessments</h3></div>
          <button className="text-button" onClick={onBrowse}>View all <Icons.arrow /></button>
        </div>
        <div className="compact-quiz-list">
          {quizzes.slice(0, 3).map((quiz, index) => (
            <article key={quiz.quiz_id}>
              <span className={`quiz-number tone-${index % 3}`}>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{quiz.title}</strong><p>{quiz.total_questions} questions · {quiz.description}</p></div>
              <Icons.arrow />
            </article>
          ))}
          {!quizzes.length && <p className="muted-copy">No active quizzes are available yet.</p>}
        </div>
      </section>
    </div>
  );
}

function QuizRunner({ quiz, onClose, onCompleted }: { quiz: QuizDetail; onClose: () => void; onCompleted: (result: AttemptResult) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [startedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const question = quiz.questions[index];
  const answered = Object.keys(answers).length;

  useEffect(() => {
    const updateElapsed = () => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  async function submitQuiz() {
    setSubmitting(true);
    setError("");
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000 / Math.max(1, quiz.questions.length)));
    try {
      const result = await request<AttemptResult>("attempts", {
        method: "POST",
        body: JSON.stringify({
          quiz_id: quiz.quiz_id,
          answers: quiz.questions.map((item) => ({
            question_id: item.question_id,
            selected_option: answers[item.question_id],
            time_taken_seconds: Math.min(3600, elapsed),
          })),
        }),
      });
      onCompleted(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit the quiz.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`${quiz.title} quiz`}>
      <div className="quiz-modal">
        <header className="quiz-modal-header">
          <div>
            <span className="eyebrow">{quiz.title}</span>
            <p>Question {index + 1} of {quiz.questions.length}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="level-pill"
              aria-label={`Elapsed time ${formatElapsedTime(elapsedSeconds)}`}
              aria-live="polite"
            >
              Time {formatElapsedTime(elapsedSeconds)}
            </span>
            <button className="icon-button" onClick={onClose} aria-label="Close quiz"><Icons.close /></button>
          </div>
        </header>
        <div className="quiz-progress"><span style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} /></div>
        <div className="quiz-question-body">
          <div className="question-meta"><span>{question.topic}</span><span>{question.difficulty}</span></div>
          <h2>{question.question}</h2>
          <div className="option-list">
            {question.options.map((option, optionIndex) => {
              const optionNumber = optionIndex + 1;
              const selected = answers[question.question_id] === optionNumber;
              return (
                <button
                  className={selected ? "selected" : ""}
                  key={`${question.question_id}-${optionNumber}`}
                  onClick={() => setAnswers((current) => ({ ...current, [question.question_id]: optionNumber }))}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>
                  <strong>{option}</strong>
                  {selected && <Icons.check />}
                </button>
              );
            })}
          </div>
          {error && <div className="notice notice-error">{error}</div>}
        </div>
        <footer className="quiz-modal-footer">
          <span>{answered} of {quiz.questions.length} answered</span>
          <div>
            <button className="button button-secondary" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>Previous</button>
            {index < quiz.questions.length - 1 ? (
              <button className="button button-primary" disabled={!answers[question.question_id]} onClick={() => setIndex((current) => current + 1)}>Next <Icons.arrow /></button>
            ) : (
              <button className="button button-primary" disabled={answered !== quiz.questions.length || submitting} onClick={submitQuiz}>{submitting ? "Submitting…" : "Submit quiz"} {!submitting && <Icons.check />}</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function ResultModal({ result, onClose }: { result: AttemptResult; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quiz result">
      <div className="result-modal">
        <span className="result-burst"><Icons.spark /></span>
        <span className="eyebrow">Assessment complete</span>
        <h2>{result.score_percentage >= 80 ? "Excellent progress" : result.score_percentage >= 60 ? "Good work" : "A useful starting point"}</h2>
        <p>Your answers have been scored and added to your learning record.</p>
        <ScoreRing value={result.score_percentage} label={result.learning_level} />
        <div className="result-stats">
          <div><strong>{result.correct_answers}/{result.attempted_questions}</strong><span>Correct answers</span></div>
          <div><strong>{Math.round(result.average_time_seconds)}s</strong><span>Average time</span></div>
        </div>
        <div className="topic-row centered">
          {result.strong_topics?.map((topic) => <span className="topic-chip strong" key={topic}>{topic} strong</span>)}
          {result.weak_topics?.map((topic) => <span className="topic-chip weak" key={topic}>{topic} focus</span>)}
        </div>
        <button className="button button-primary button-wide" onClick={onClose}>Return to quizzes <Icons.arrow /></button>
      </div>
    </div>
  );
}

function QuizLibrary() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    request<QuizSummary[]>("quizzes")
      .then(setQuizzes)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load quizzes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    request<QuizSummary[]>("quizzes")
      .then(setQuizzes)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load quizzes."))
      .finally(() => setLoading(false));
  }, []);

  async function openQuiz(quizId: number) {
    setOpening(quizId);
    setError("");
    try {
      const detail = await request<QuizDetail>(`quizzes/${quizId}`);
      if (!detail.questions?.length) {
        setError("This quiz does not have any questions yet.");
        return;
      }
      setActiveQuiz(detail);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open this quiz.");
    } finally {
      setOpening(null);
    }
  }

  if (loading) return <LoadingPanel label="Loading assessments…" />;

  return (
    <div className="view-stack">
      <section className="view-intro">
        <div><span className="eyebrow">Assessment library</span><h2>Choose your next challenge</h2><p>Each quiz becomes a topic-by-topic progress report as soon as you submit.</p></div>
        <span className="intro-count">{quizzes.length}<small>active quizzes</small></span>
      </section>
      {error && <div className="notice notice-error">{error}</div>}
      {quizzes.length ? (
        <section className="quiz-card-grid">
          {quizzes.map((quiz, index) => (
            <article className={`quiz-card accent-${index % 3}`} key={quiz.quiz_id}>
              <div className="quiz-card-top"><span className="quiz-card-index">{String(index + 1).padStart(2, "0")}</span><span className="question-count"><Icons.clock /> {quiz.total_questions} questions</span></div>
              <div><span className="eyebrow">Personalized assessment</span><h3>{quiz.title}</h3><p>{quiz.description}</p></div>
              <button className="button button-dark" disabled={opening === quiz.quiz_id} onClick={() => openQuiz(quiz.quiz_id)}>{opening === quiz.quiz_id ? "Opening…" : "Start assessment"}<Icons.arrow /></button>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No active quizzes" text="An administrator can publish a quiz from the management dashboard." />}

      {activeQuiz && <QuizRunner quiz={activeQuiz} onClose={() => setActiveQuiz(null)} onCompleted={(completed) => { setActiveQuiz(null); setResult(completed); }} />}
      {result && <ResultModal result={result} onClose={() => { setResult(null); load(); }} />}
    </div>
  );
}

function AttemptHistory() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    request<Attempt[]>("auth/me/attempts")
      .then(setAttempts)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load your history."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPanel label="Loading attempt history…" />;

  return (
    <div className="view-stack">
      <section className="view-intro">
        <div><span className="eyebrow">Progress archive</span><h2>Your assessment history</h2><p>Review scores, topic signals, and the recommendations generated after each quiz.</p></div>
      </section>
      {error && <div className="notice notice-error">{error}</div>}
      {attempts.length ? (
        <section className="history-list">
          {attempts.map((attempt) => (
            <article key={attempt.id} className="history-card">
              <ScoreRing value={attempt.score_percentage} label="Score" />
              <div className="history-main">
                <div><span className="eyebrow">Quiz {attempt.quiz_id}</span><h3>{attempt.learning_level} performance</h3><p>{attempt.correct_answers} correct from {attempt.attempted_questions} questions · {Math.round(attempt.average_time_seconds)}s average</p></div>
                <div className="topic-row">
                  {attempt.strong_topics?.map((topic) => <span className="topic-chip strong" key={topic}>{topic}</span>)}
                  {attempt.weak_topics?.map((topic) => <span className="topic-chip weak" key={topic}>{topic}</span>)}
                </div>
              </div>
              <time>{formatDate(attempt.created_at)}</time>
            </article>
          ))}
        </section>
      ) : <EmptyState title="No history yet" text="Complete your first assessment to build a progress record." />}
    </div>
  );
}

function TeacherDashboard() {
  const [students, setStudents] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    request<User[]>("students")
      .then((data) => {
        setStudents(data);
        if (data[0]) {
          setDetailLoading(true);
          setSelected(data[0]);
        }
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load students."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    Promise.all([
      request<StudentSummary>(`teacher/students/${selected.id}/summary`),
      request<Attempt[]>(`teacher/students/${selected.id}/attempts`),
    ])
      .then(([summaryData, attemptData]) => { setSummary(summaryData); setAttempts(attemptData); })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load this learner."))
      .finally(() => setDetailLoading(false));
  }, [selected]);

  if (loading) return <LoadingPanel label="Loading your class…" />;

  return (
    <div className="teacher-layout">
      <aside className="student-directory">
        <div><span className="eyebrow">Class directory</span><h2>Students</h2><p>{students.length} learners</p></div>
        <div className="student-list">
          {students.map((student) => (
            <button className={selected?.id === student.id ? "active" : ""} key={student.id} onClick={() => {
              if (selected?.id !== student.id) {
                setDetailLoading(true);
                setSelected(student);
              }
            }}>
              <span>{initials(student.name)}</span><div><strong>{student.name}</strong><small>{student.email}</small></div><Icons.arrow />
            </button>
          ))}
        </div>
      </aside>
      <section className="teacher-detail">
        {error && <div className="notice notice-error">{error}</div>}
        {!selected ? <EmptyState title="No students yet" text="Registered students will appear here." /> : detailLoading ? <LoadingPanel label="Building student summary…" /> : (
          <div className="view-stack">
            <section className="student-profile-banner">
              <span className="large-avatar">{initials(selected.name)}</span>
              <div><span className="eyebrow eyebrow-light">Learner overview</span><h2>{selected.name}</h2><p>{selected.email}</p></div>
              <span className="profile-status"><span /> Active learner</span>
            </section>
            <section className="metric-grid">
              <article className="metric-card"><span className="metric-icon indigo"><Icons.quiz /></span><div><span>Total attempts</span><strong>{summary?.total_attempts ?? attempts.length}</strong><small>Recorded quizzes</small></div></article>
              <article className="metric-card"><span className="metric-icon lime"><Icons.chart /></span><div><span>Average score</span><strong>{Math.round(summary?.average_score_percentage ?? 0)}%</strong><small>Overall accuracy</small></div></article>
              <article className="metric-card"><span className="metric-icon coral"><Icons.spark /></span><div><span>Latest level</span><strong className="text-value">{summary?.latest_learning_level ?? "—"}</strong><small>Current learning band</small></div></article>
            </section>
            <section className="dashboard-grid">
              <article className="panel">
                <div className="panel-heading"><div><span className="eyebrow">Topic signals</span><h3>Strengths and focus areas</h3></div></div>
                <div className="topic-group"><strong>Strong topics</strong><div className="topic-row">{summary?.latest_strong_topics?.length ? summary.latest_strong_topics.map((topic) => <span className="topic-chip strong" key={topic}>{topic}</span>) : <span className="muted-copy">Not enough data yet.</span>}</div></div>
                <div className="topic-group"><strong>Needs practice</strong><div className="topic-row">{summary?.latest_weak_topics?.length ? summary.latest_weak_topics.map((topic) => <span className="topic-chip weak" key={topic}>{topic}</span>) : <span className="muted-copy">No weak topics identified.</span>}</div></div>
              </article>
              <article className="panel recommendation-panel">
                <div className="panel-heading"><div><span className="eyebrow">Teaching guidance</span><h3>Recommended next steps</h3></div></div>
                <ul className="recommendation-list">{summary?.latest_recommendations?.slice(0, 3).map((item, index) => <li key={index}><span>{index + 1}</span><p>{getRecommendation(item)}</p></li>)}</ul>
                {!summary?.latest_recommendations?.length && <p className="muted-copy">Recommendations will appear after a quiz attempt.</p>}
              </article>
            </section>
            <section className="panel">
              <div className="panel-heading"><div><span className="eyebrow">Recent activity</span><h3>Assessment attempts</h3></div></div>
              <div className="attempt-table">
                <div className="table-head"><span>Date</span><span>Quiz</span><span>Score</span><span>Level</span></div>
                {attempts.slice(0, 8).map((attempt) => <div className="table-row" key={attempt.id}><span>{formatDate(attempt.created_at)}</span><span>Quiz {attempt.quiz_id}</span><span><strong>{Math.round(attempt.score_percentage)}%</strong></span><span>{attempt.learning_level}</span></div>)}
                {!attempts.length && <p className="muted-copy table-empty">No attempts recorded.</p>}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

type AdminQuiz = { id?: number; quiz_id?: number; title: string; description: string; is_active?: boolean; total_questions?: number };

function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quizForm, setQuizForm] = useState({ title: "", description: "", is_active: true });
  const [questionForm, setQuestionForm] = useState({ quiz_id: "", question_text: "", option_1: "", option_2: "", option_3: "", option_4: "", correct_option: "1", topic: "", difficulty: "easy" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([request<User[]>("admin/users"), request<QuizSummary[]>("quizzes")])
      .then(([userData, quizData]) => {
        setUsers(userData);
        setQuizzes(quizData);
        if (quizData[0]) setQuestionForm((current) => ({ ...current, quiz_id: String(quizData[0].quiz_id) }));
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load administration data."))
      .finally(() => setLoading(false));
  }, []);

  async function updateRole(user: User, role: User["role"]) {
    setError("");
    try {
      const updated = await request<User>(`admin/users/${user.id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      setUsers((current) => current.map((item) => item.id === user.id ? updated : item));
      setSuccess(`${user.name}'s role is now ${role}.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update role."); }
  }

  async function createQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const created = await request<AdminQuiz>("admin/quizzes", { method: "POST", body: JSON.stringify(quizForm) });
      const id = created.id ?? created.quiz_id;
      setQuizForm({ title: "", description: "", is_active: true });
      setSuccess(`Quiz created${id ? ` with ID ${id}` : ""}. You can add questions now.`);
      const quizData = await request<QuizSummary[]>("quizzes");
      setQuizzes(quizData);
      if (id) setQuestionForm((current) => ({ ...current, quiz_id: String(id) }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create quiz."); }
    finally { setSaving(false); }
  }

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      await request(`admin/quizzes/${questionForm.quiz_id}/questions`, {
        method: "POST",
        body: JSON.stringify({
          question_text: questionForm.question_text,
          options: [questionForm.option_1, questionForm.option_2, questionForm.option_3, questionForm.option_4],
          correct_option: Number(questionForm.correct_option),
          topic: questionForm.topic,
          difficulty: questionForm.difficulty,
        }),
      });
      setQuestionForm((current) => ({ ...current, question_text: "", option_1: "", option_2: "", option_3: "", option_4: "", correct_option: "1", topic: "", difficulty: "easy" }));
      setSuccess("Question added to the quiz.");
      setQuizzes(await request<QuizSummary[]>("quizzes"));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add question."); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingPanel label="Loading administration tools…" />;

  return (
    <div className="view-stack">
      <section className="view-intro"><div><span className="eyebrow">Administration</span><h2>Manage the learning platform</h2><p>Control user access and publish assessment content from one place.</p></div><span className="intro-count">{users.length}<small>registered users</small></span></section>
      {error && <div className="notice notice-error">{error}</div>}
      {success && <div className="notice notice-success">{success}</div>}
      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Access control</span><h3>User roles</h3></div><span className="secure-label">Admin only</span></div>
        <div className="user-table">
          <div className="table-head"><span>User</span><span>Email</span><span>Role</span><span>Joined</span></div>
          {users.map((user) => (
            <div className="table-row" key={user.id}>
              <span className="user-cell"><i>{initials(user.name)}</i><strong>{user.name}</strong></span>
              <span>{user.email}</span>
              <span><select value={user.role} onChange={(event) => updateRole(user, event.target.value as User["role"])}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></select></span>
              <span>{formatDate(user.created_at)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-form-grid">
        <form className="panel admin-form" onSubmit={createQuiz}>
          <div className="panel-heading"><div><span className="eyebrow">Quiz builder</span><h3>Create an assessment</h3></div><span className="metric-icon indigo"><Icons.plus /></span></div>
          <label><span>Quiz title</span><input value={quizForm.title} onChange={(event) => setQuizForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Algebra foundations" minLength={3} required /></label>
          <label><span>Description</span><textarea value={quizForm.description} onChange={(event) => setQuizForm((current) => ({ ...current, description: event.target.value }))} placeholder="What this assessment covers" rows={3} required /></label>
          <label className="toggle-label"><input type="checkbox" checked={quizForm.is_active} onChange={(event) => setQuizForm((current) => ({ ...current, is_active: event.target.checked }))} /><span>Publish as active</span></label>
          <button className="button button-primary button-wide" disabled={saving}>Create quiz <Icons.arrow /></button>
        </form>

        <form className="panel admin-form" onSubmit={addQuestion}>
          <div className="panel-heading"><div><span className="eyebrow">Question bank</span><h3>Add a question</h3></div><span className="metric-icon lime"><Icons.quiz /></span></div>
          <label><span>Choose quiz</span><select value={questionForm.quiz_id} onChange={(event) => setQuestionForm((current) => ({ ...current, quiz_id: event.target.value }))} required><option value="">Select a quiz</option>{quizzes.map((quiz) => <option value={quiz.quiz_id} key={quiz.quiz_id}>{quiz.title}</option>)}</select></label>
          <label><span>Question</span><textarea value={questionForm.question_text} onChange={(event) => setQuestionForm((current) => ({ ...current, question_text: event.target.value }))} placeholder="Write the question" rows={2} required /></label>
          <div className="option-input-grid">{([1, 2, 3, 4] as const).map((item) => <label key={item}><span>Option {item}</span><input value={questionForm[`option_${item}`]} onChange={(event) => setQuestionForm((current) => ({ ...current, [`option_${item}`]: event.target.value }))} required /></label>)}</div>
          <div className="form-row"><label><span>Correct option</span><select value={questionForm.correct_option} onChange={(event) => setQuestionForm((current) => ({ ...current, correct_option: event.target.value }))}>{[1, 2, 3, 4].map((item) => <option value={item} key={item}>Option {item}</option>)}</select></label><label><span>Topic</span><input value={questionForm.topic} onChange={(event) => setQuestionForm((current) => ({ ...current, topic: event.target.value }))} placeholder="e.g. Algebra" required /></label><label><span>Difficulty</span><select value={questionForm.difficulty} onChange={(event) => setQuestionForm((current) => ({ ...current, difficulty: event.target.value }))}><option value="easy">Easy</option><option value="intermediate">Intermediate</option><option value="hard">Hard</option></select></label></div>
          <button className="button button-dark button-wide" disabled={saving || !quizzes.length}>Add question <Icons.plus /></button>
        </form>
      </section>
    </div>
  );
}

export function Portal({ user, onSignedOut }: { user: User; onSignedOut: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const studentNav = [
    { id: "overview" as const, label: "Overview", icon: Icons.home },
    { id: "quizzes" as const, label: "Quizzes", icon: Icons.quiz },
    { id: "history" as const, label: "Attempt history", icon: Icons.history },
  ];
  const teacherNav = [{ id: "students" as const, label: "Student insights", icon: Icons.users }];
  const adminNav = [{ id: "manage" as const, label: "Administration", icon: Icons.settings }];
  const nav = user.role === "student" ? studentNav : user.role === "teacher" ? teacherNav : adminNav;
  const [section, setSection] = useState<PortalSection>(nav[0].id);

  async function signOut() {
    await sessionRequest("logout");
    onSignedOut();
  }

  const sectionTitle = useMemo(() => nav.find((item) => item.id === section)?.label ?? "Dashboard", [nav, section]);

  return (
    <main className="portal-shell">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand brand-light"><span className="brand-mark"><Icons.spark /></span><span>Learn_Nova</span></div>
        <button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><Icons.close /></button>
        <div className="sidebar-user"><span>{initials(user.name)}</span><div><strong>{user.name}</strong><small>{user.role}</small></div></div>
        <nav>
          <span className="nav-label">Workspace</span>
          {nav.map((item) => (
            <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); setMobileOpen(false); }}><item.icon /><span>{item.label}</span></button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="api-status"><span /><div><strong>Learning API</strong><small>Connected securely</small></div></div>
          <button onClick={signOut}><Icons.logout /><span>Sign out</span></button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <section className="portal-main">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Icons.menu /></button>
          <div><span className="eyebrow">{user.role} workspace</span><h1>{sectionTitle}</h1></div>
          <div className="topbar-profile"><div><strong>{user.name}</strong><small>{user.email}</small></div><span>{initials(user.name)}</span></div>
        </header>
        <div className="portal-content">
          {user.role === "student" && section === "overview" && <StudentOverview user={user} onBrowse={() => setSection("quizzes")} />}
          {user.role === "student" && section === "quizzes" && <QuizLibrary />}
          {user.role === "student" && section === "history" && <AttemptHistory />}
          {user.role === "teacher" && <TeacherDashboard />}
          {user.role === "admin" && <AdminDashboard />}
        </div>
      </section>
    </main>
  );
}
