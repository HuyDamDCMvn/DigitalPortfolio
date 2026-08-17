"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { type Locale } from "../i18n";
import {
  getServerLocale,
  readLocale,
  subscribeLocale,
  writeLocale,
} from "../locale-provider";
import data from "./data.json";
import { SkillRadar } from "./radar-chart";
import viText from "./vi.json";

type Skill = { id: string; n: number; text: string };
type Group = { id: string; name: string; skills: Skill[] };

const groups = data.groups as Group[];
const allSkills = groups.flatMap((group) => group.skills);
const STORAGE_KEY = "dcmvn-mep-skills-survey-v2";

const SCALE = [
  {
    score: 0,
    fill: "#ffffff",
    ink: "#222",
    en: "Never used",
    vi: "Chưa từng dùng",
    enDesc: "Don't have any information or knowledge about this before",
    viDesc: "Chưa có thông tin hoặc kiến thức về lĩnh vực này",
  },
  {
    score: 1,
    fill: "#deebf7",
    ink: "#1f4e79",
    en: "Limited experience / Beginner",
    vi: "Ít kinh nghiệm / Mới bắt đầu",
    enDesc: "Already have knowledge but not yet undertake in any project",
    viDesc: "Đã có kiến thức nhưng chưa làm trên dự án",
  },
  {
    score: 2,
    fill: "#bdd7ee",
    ink: "#1f4e79",
    en: "Experienced / Intermediate",
    vi: "Có kinh nghiệm / Trung bình",
    enDesc: "Undertaken work in this area on 1–2 occasions with closely instruction",
    viDesc: "Đã làm 1–2 lần, cần hướng dẫn sát",
  },
  {
    score: 3,
    fill: "#9dc3e6",
    ink: "#1f4e79",
    en: "Highly experienced / Advanced",
    vi: "Nhiều kinh nghiệm / Nâng cao",
    enDesc: "Undertaken work in this area over 3 occasions but need support when have issue",
    viDesc: "Đã làm trên 3 lần, vẫn cần hỗ trợ khi gặp vấn đề",
  },
  {
    score: 4,
    fill: "#5b9bd5",
    ink: "#062553",
    en: "Proficient",
    vi: "Thành thạo",
    enDesc: "Relatively proficient. Considered able to work independently in this field",
    viDesc: "Khá thành thạo, làm độc lập được trong lĩnh vực này",
  },
  {
    score: 5,
    fill: "#1f4e79",
    ink: "#ffffff",
    en: "Expert",
    vi: "Chuyên gia",
    enDesc: "Deep knowledge in this field and have been able to train another member",
    viDesc: "Hiểu sâu và có thể đào tạo người khác",
  },
] as const;

const GROUP_META: Record<string, { en: string; vi: string; bg: string; ink: string }> = {
  modeling: { en: "Modeling", vi: "Mô hình hóa", bg: "#c6e0b4", ink: "#375623" },
  elements: { en: "Elements", vi: "Thành phần", bg: "#b4c7e7", ink: "#1f4e79" },
  families: { en: "Families", vi: "Family", bg: "#ffe699", ink: "#806000" },
  views: { en: "Views", vi: "View", bg: "#d0cece", ink: "#595959" },
  collaboration: { en: "Collaboration", vi: "Cộng tác", bg: "#f4b183", ink: "#6b2a00" },
  documentation: { en: "Documentation", vi: "Hồ sơ", bg: "#bdd7ee", ink: "#1f4e79" },
  management: { en: "Management", vi: "Quản lý", bg: "#e2d5f1", ink: "#5b3b8c" },
};

const COPY = {
  en: {
    brand: "Digital Team",
    preview: "Preview",
    title: "REVIT SKILLS DEVELOPMENT MATRIX",
    discipline: "DISCIPLINE: MEP",
    instruction: "Please rate (0–5) your capabilities on the following skill description & criteria",
    name: "Name",
    role: "Position",
    teamLead: "Team Lead",
    date: "Date",
    certAsk: "Have Revit Certification?",
    certHint: "(x) if Yes",
    acu: "Autodesk Certified User (ACU)",
    acp: "Autodesk Certified Professional (ACP)",
    other: "Others:",
    otherPlaceholder: "Certificate name",
    skillGroup: "SKILL GROUP",
    skill: "Skill description",
    rating: "Rating",
    outOf: "(out of 5)",
    totalSkills: "Total Skills",
    maxPoints: "Maximum Points",
    achieved: "Current Achieved Points",
    percentage: "Percentage",
    evaluation: "Evaluation",
    neverUsed: 'Number of Skills with "Never Used"',
    expertCount: 'Number of Skills with "Expert"',
    summary: "SUMMARY",
    overall: "OVERALL",
    strongest: "STRONGEST SKILLS",
    lowest: "LOWEST SKILLS",
    printPdf: "Print PDF",
    reset: "Clear answers",
    download: "Download JSON",
    confirmReset: "Clear all answers?",
    rolePlaceholder: "e.g. Digital Lead",
    swipeHint: "Rate each skill with the 0–5 buttons on each card.",
    langGroup: "Language",
    progress: "answered",
    pending: "—",
    storageBlockedTitle: "Can't save this survey",
    storageBlocked:
      "This browser is blocking local storage, so ratings can't be saved. Allow storage for this site, then reload.",
    brandAria: "Digital Team portfolio",
    radarTitle: "Skill profile",
    radarHint: "Average score per group (0–5). The chart updates as you rate.",
    radarEmpty: "Rate skills to plot the 7 groups",
    radarAvg: "avg",
    evals: {
      Inadequate: "Inadequate",
      "Below Average": "Below Average",
      Average: "Average",
      "Above Average": "Above Average",
      Excellent: "Excellent",
      Beginner: "Beginner",
      Intermediate: "Intermediate",
      Advanced: "Advanced",
      Proficient: "Proficient",
      Expert: "Expert",
    },
  },
  vi: {
    brand: "Digital Team",
    preview: "Xem trước",
    title: "MA TRẬN PHÁT TRIỂN KỸ NĂNG REVIT",
    discipline: "CHUYÊN MÔN: MEP",
    instruction: "Hãy đánh giá (0–5) năng lực của bạn theo mô tả kỹ năng và tiêu chí sau",
    name: "Họ và tên",
    role: "Vị trí",
    teamLead: "Team Lead",
    date: "Ngày",
    certAsk: "Có chứng chỉ Revit?",
    certHint: "(x) nếu Có",
    acu: "Autodesk Certified User (ACU)",
    acp: "Autodesk Certified Professional (ACP)",
    other: "Khác:",
    otherPlaceholder: "Tên chứng chỉ",
    skillGroup: "SKILL GROUP",
    skill: "Mô tả kỹ năng",
    rating: "Điểm",
    outOf: "(thang 5)",
    totalSkills: "Tổng kỹ năng",
    maxPoints: "Điểm tối đa",
    achieved: "Điểm đạt được",
    percentage: "Tỷ lệ",
    evaluation: "Đánh giá",
    neverUsed: 'Số kỹ năng "Chưa từng dùng"',
    expertCount: 'Số kỹ năng "Chuyên gia"',
    summary: "TỔNG KẾT",
    overall: "TỔNG THỂ",
    strongest: "NHÓM MẠNH NHẤT",
    lowest: "NHÓM YẾU NHẤT",
    printPdf: "In PDF",
    reset: "Xóa câu trả lời",
    download: "Tải JSON",
    confirmReset: "Xóa toàn bộ câu trả lời?",
    rolePlaceholder: "vd. Digital Lead",
    swipeHint: "Chấm từng kỹ năng bằng nút 0–5 trên mỗi thẻ.",
    langGroup: "Ngôn ngữ",
    progress: "đã trả lời",
    pending: "—",
    storageBlockedTitle: "Không lưu được khảo sát",
    storageBlocked:
      "Trình duyệt đang chặn bộ nhớ cục bộ nên không lưu được điểm. Cho phép lưu trữ cho trang này, rồi tải lại.",
    brandAria: "Portfolio Digital Team",
    radarTitle: "Hồ sơ kỹ năng",
    radarHint: "Điểm trung bình từng nhóm (0–5). Biểu đồ cập nhật khi bạn chấm.",
    radarEmpty: "Chấm điểm để vẽ 7 nhóm kỹ năng",
    radarAvg: "tb",
    evals: {
      Inadequate: "Chưa đạt",
      "Below Average": "Dưới trung bình",
      Average: "Trung bình",
      "Above Average": "Trên trung bình",
      Excellent: "Xuất sắc",
      Beginner: "Mới bắt đầu",
      Intermediate: "Trung cấp",
      Advanced: "Nâng cao",
      Proficient: "Thành thạo",
      Expert: "Chuyên gia",
    },
  },
} as const;

type EvalTone = keyof typeof COPY.en.evals;
type Answers = Record<string, number>;
type Profile = {
  name: string;
  role: string;
  teamLead: string;
  date: string;
  acu: boolean;
  acp: boolean;
  other: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyProfile(): Profile {
  return { name: "", role: "", teamLead: "", date: todayIso(), acu: false, acp: false, other: "" };
}

type SurveyDraft = { profile: Profile; answers: Answers };

const emptyDraft = (): SurveyDraft => ({ profile: emptyProfile(), answers: {} });
/** Stable snapshot for SSR and for when localStorage throws — React 19 forbids a new object each getSnapshot. */
const EMPTY_DRAFT: SurveyDraft = emptyDraft();
const draftListeners = new Set<() => void>();
let draftCache: SurveyDraft | null = null;
let draftRaw: string | null = null;

function subscribeDraft(listener: () => void) {
  draftListeners.add(listener);
  return () => draftListeners.delete(listener);
}

function parseDraft(raw: string | null): SurveyDraft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const saved = JSON.parse(raw) as { profile?: Profile; answers?: Answers };
    return {
      profile: saved.profile ? { ...emptyProfile(), ...saved.profile } : emptyProfile(),
      answers: saved.answers ?? {},
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function probeStorage(): boolean {
  try {
    const probe = `${STORAGE_KEY}:probe`;
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function getDraftSnapshot(): SurveyDraft {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    if (!draftCache) draftCache = EMPTY_DRAFT;
    return draftCache;
  }
  if (raw === draftRaw && draftCache) return draftCache;
  draftRaw = raw;
  draftCache = parseDraft(raw);
  return draftCache;
}

function writeDraft(next: SurveyDraft, locale: Locale) {
  const raw = JSON.stringify({ locale, profile: next.profile, answers: next.answers });
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    return;
  }
  draftRaw = raw;
  draftCache = next;
  for (const listener of draftListeners) listener();
}

function getServerDraft(): SurveyDraft {
  return EMPTY_DRAFT;
}

function groupTone(ratio: number): EvalTone {
  if (ratio < 0.2) return "Inadequate";
  if (ratio < 0.4) return "Below Average";
  if (ratio < 0.6) return "Average";
  if (ratio < 0.8) return "Above Average";
  return "Excellent";
}

function overallBand(ratio: number): EvalTone {
  if (ratio < 0.2) return "Beginner";
  if (ratio < 0.4) return "Intermediate";
  if (ratio < 0.6) return "Advanced";
  if (ratio < 0.8) return "Proficient";
  return "Expert";
}

function cellFilled(score: number | undefined, col: number) {
  if (score === undefined) return false;
  if (col === 0) return score === 0;
  return score >= col;
}

function skillLabel(skill: Skill, locale: Locale) {
  if (locale === "vi") {
    const translated = (viText as Record<string, string>)[skill.id];
    return translated ?? skill.text;
  }
  return skill.text;
}

export function SkillsSurveyForm() {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, getServerLocale);
  const draft = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraft);
  const [tip, setTip] = useState<{ title: string; desc: string; x: number; y: number; fill: string } | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const blocked = !storageOk;

  const profile = draft.profile;
  const answers = draft.answers;
  const t = COPY[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    setStorageOk(probeStorage());
  }, []);

  function setLocale(next: Locale) {
    writeLocale(next);
    writeDraft(draft, next);
  }

  function setProfile(next: Profile) {
    if (blocked) return;
    writeDraft({ profile: next, answers }, locale);
  }

  function setAnswers(next: Answers | ((current: Answers) => Answers)) {
    const answersNext = typeof next === "function" ? next(answers) : next;
    writeDraft({ profile, answers: answersNext }, locale);
  }

  const answeredCount = Object.keys(answers).length;

  const scores = useMemo(() => {
    return groups.map((item) => {
      const values = item.skills.map((skill) => answers[skill.id]);
      const rated = values.filter((value) => value !== undefined);
      const achieved = rated.reduce((sum, value) => sum + value, 0);
      const max = item.skills.length * 5;
      const ratio = max === 0 ? 0 : achieved / max;
      return {
        id: item.id,
        total: item.skills.length,
        max,
        achieved,
        ratio,
        percent: Math.round(ratio * 100),
        eval: groupTone(ratio),
        neverUsed: values.filter((value) => value === 0).length,
        expert: values.filter((value) => value === 5).length,
        answered: rated.length,
      };
    });
  }, [answers]);

  const overall = useMemo(() => {
    const max = allSkills.length * 5;
    const achieved = Object.values(answers).reduce((sum, value) => sum + value, 0);
    const ratio = max === 0 ? 0 : achieved / max;
    const ranked = scores.filter((item) => item.answered > 0).sort((a, b) => b.ratio - a.ratio);
    return {
      max,
      achieved,
      ratio,
      percent: Math.round(ratio * 100),
      eval: overallBand(ratio),
      strongest: ranked[0] ?? null,
      lowest: ranked.length ? ranked[ranked.length - 1] : null,
    };
  }, [answers, scores]);

  function setScore(id: string, score: number) {
    if (blocked) return;
    setAnswers((current) => {
      const next = { ...current };
      if (next[id] === score) delete next[id];
      else next[id] = score;
      return next;
    });
  }

  function showScaleTip(target: HTMLElement, item: (typeof SCALE)[number]) {
    const rect = target.getBoundingClientRect();
    setTip({
      title: `${item.score} · ${locale === "vi" ? item.vi : item.en}`,
      desc: locale === "vi" ? item.viDesc : item.enDesc,
      x: rect.left + rect.width / 2,
      y: rect.top,
      fill: item.fill,
    });
  }

  function printPdf() {
    const previousTitle = document.title;
    const who = profile.name.trim().replace(/\s+/g, "-") || "draft";
    document.title = `MEP-Skills-Survey-${who}`;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  function downloadJson() {
    if (blocked) return;
    const who = profile.name.trim().replace(/\s+/g, "-") || "draft";
    const blob = new Blob(
      [JSON.stringify({ locale, profile, answers }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MEP-Skills-Survey-${who}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearAnswers() {
    if (blocked) return;
    if (!window.confirm(t.confirmReset)) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      return;
    }
    draftRaw = null;
    draftCache = EMPTY_DRAFT;
    for (const listener of draftListeners) listener();
  }

  return (
    <main className={blocked ? "skills-survey is-blocked" : "skills-survey"}>
      <header className="skills-survey-bar">
        <a className="skills-survey-brand" href="/" aria-label={t.brandAria}>
          <img src="/images/bkw-dcm-logo.svg" alt="" />
          <span>{t.brand}</span>
        </a>
        <div className="skills-survey-tools">
          <p className="skills-survey-count">
            {answeredCount}/{allSkills.length} {t.progress}
          </p>
          <div className="skills-survey-lang" role="group" aria-label={t.langGroup}>
            <button type="button" className={locale === "en" ? "is-active" : ""} onClick={() => setLocale("en")}>
              EN
            </button>
            <button type="button" className={locale === "vi" ? "is-active" : ""} onClick={() => setLocale("vi")}>
              VI
            </button>
          </div>
        </div>
      </header>

      {blocked ? (
        <div className="skills-survey-blocked" role="alert">
          <strong>{t.storageBlockedTitle}</strong>
          <p>{t.storageBlocked}</p>
        </div>
      ) : null}

      <div className="matrix-scroll" onScroll={() => setTip(null)}>
        <section className="matrix">
          <div className="matrix-head">
            <div className="matrix-title">
              <img
                className="matrix-title-logo"
                src="/images/bkw-dcm-logo.svg"
                alt="BKW Engineering — Digital Construction Management"
              />
              <p className="matrix-kicker">{t.brand} · {t.preview}</p>
              <h1>
                {t.title}
                <span>{t.discipline}</span>
              </h1>
              <p className="matrix-instruction">{t.instruction}</p>
            </div>

            <div className="matrix-scale" aria-label={t.rating}>
              {SCALE.map((item) => (
                <div key={item.score} className="matrix-scale-col" style={{ background: item.fill, color: item.ink }}>
                  <strong>{item.score}</strong>
                  <b>{locale === "vi" ? item.vi : item.en}</b>
                  <span>{locale === "vi" ? item.viDesc : item.enDesc}</span>
                </div>
              ))}
            </div>

            <fieldset className="matrix-id" disabled={blocked}>
              <label>
                {t.name}
                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  autoComplete="name"
                  disabled={blocked}
                />
              </label>
              <label>
                {t.role}
                <input
                  type="text"
                  value={profile.role}
                  onChange={(event) => setProfile({ ...profile, role: event.target.value })}
                  placeholder={t.rolePlaceholder}
                  disabled={blocked}
                />
              </label>
              <label>
                {t.teamLead}
                <input
                  type="text"
                  value={profile.teamLead}
                  onChange={(event) => setProfile({ ...profile, teamLead: event.target.value })}
                  disabled={blocked}
                />
              </label>
              <label>
                {t.date}
                <input
                  type="date"
                  value={profile.date}
                  onChange={(event) => setProfile({ ...profile, date: event.target.value })}
                  disabled={blocked}
                />
              </label>
              <p className="matrix-id-cert">
                {t.certAsk} <em>{t.certHint}</em>
              </p>
              <label className="matrix-check">
                <input
                  type="checkbox"
                  checked={profile.acu}
                  onChange={(event) => setProfile({ ...profile, acu: event.target.checked })}
                  disabled={blocked}
                />
                {t.acu}
              </label>
              <label className="matrix-check">
                <input
                  type="checkbox"
                  checked={profile.acp}
                  onChange={(event) => setProfile({ ...profile, acp: event.target.checked })}
                  disabled={blocked}
                />
                {t.acp}
              </label>
              <label>
                {t.other}
                <input
                  type="text"
                  value={profile.other}
                  placeholder={t.otherPlaceholder}
                  onChange={(event) => setProfile({ ...profile, other: event.target.value })}
                  disabled={blocked}
                />
              </label>
            </fieldset>
          </div>

          <table className="matrix-table">
            <thead>
              <tr>
                <th className="is-group">{t.skillGroup}</th>
                <th className="is-num">#</th>
                <th className="is-skill">{t.skill}</th>
                <th className="is-rating">
                  {t.rating}
                  <small>{t.outOf}</small>
                </th>
                {SCALE.map((item) => (
                  <th key={item.score} className="is-score" style={{ background: item.fill, color: item.ink }}>
                    {item.score}
                  </th>
                ))}
                <th className="is-stats">{t.summary}</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, groupIndex) => {
                const meta = GROUP_META[group.id];
                const stat = scores[groupIndex];
                return group.skills.map((skill, skillIndex) => {
                  const score = answers[skill.id];
                  return (
                    <tr key={skill.id}>
                      {skillIndex === 0 ? (
                        <th
                          className="matrix-group"
                          rowSpan={group.skills.length}
                          style={{ background: meta.bg, color: meta.ink }}
                          scope="rowgroup"
                        >
                          <span>{meta[locale]}</span>
                        </th>
                      ) : null}
                      <td className="is-num">{skill.n}</td>
                      <td className="is-skill">{skillLabel(skill, locale)}</td>
                      <td className={score === undefined ? "is-rating is-empty" : "is-rating is-filled"}>
                        {score === undefined ? "" : score}
                      </td>
                      {SCALE.map((item) => {
                        const filled = cellFilled(score, item.score);
                        const selected = score === item.score;
                        const label = locale === "vi" ? item.vi : item.en;
                        const desc = locale === "vi" ? item.viDesc : item.enDesc;
                        return (
                          <td key={item.score} className="is-score">
                            <button
                              type="button"
                              className={selected ? "is-selected" : filled ? "is-filled" : ""}
                              style={filled ? { background: item.fill, color: item.ink } : undefined}
                              aria-pressed={selected}
                              aria-label={`${skillLabel(skill, locale)}: ${item.score} · ${label}. ${desc}`}
                              disabled={blocked}
                              onPointerEnter={(event) => showScaleTip(event.currentTarget, item)}
                              onPointerLeave={() => setTip(null)}
                              onFocus={(event) => showScaleTip(event.currentTarget, item)}
                              onBlur={() => setTip(null)}
                              onClick={() => setScore(skill.id, item.score)}
                            />
                          </td>
                        );
                      })}
                      {skillIndex === 0 ? (
                        <td className="matrix-stats" rowSpan={group.skills.length}>
                          <div className="matrix-stat-card" style={{ borderColor: meta.ink }}>
                            <strong style={{ background: meta.bg, color: meta.ink }}>{meta[locale]}</strong>
                            <dl>
                              <div>
                                <dt>{t.totalSkills}</dt>
                                <dd>{stat.total}</dd>
                              </div>
                              <div>
                                <dt>{t.maxPoints}</dt>
                                <dd>{stat.max}</dd>
                              </div>
                              <div>
                                <dt>{t.achieved}</dt>
                                <dd className={stat.answered ? "is-hot" : ""}>{stat.answered ? stat.achieved : t.pending}</dd>
                              </div>
                              <div>
                                <dt>{t.percentage}</dt>
                                <dd className={stat.answered ? "is-hot" : ""}>{stat.answered ? `${stat.percent}%` : t.pending}</dd>
                              </div>
                              <div>
                                <dt>{t.evaluation}</dt>
                                <dd>{stat.answered ? t.evals[stat.eval] : t.pending}</dd>
                              </div>
                              <div>
                                <dt>{t.neverUsed}</dt>
                                <dd>{stat.neverUsed}</dd>
                              </div>
                              <div>
                                <dt>{t.expertCount}</dt>
                                <dd>{stat.expert}</dd>
                              </div>
                            </dl>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>

          <p className="matrix-swipe-hint">{t.swipeHint}</p>
          <div className="matrix-mobile">
            {groups.map((group) => (
              <section key={group.id} className="skill-card-group">
                <h2>{GROUP_META[group.id][locale]}</h2>
                {group.skills.map((skill) => {
                  const score = answers[skill.id];
                  const label = skillLabel(skill, locale);
                  return (
                    <article key={skill.id} className="skill-card">
                      <p className="skill-card-n">{skill.n}</p>
                      <h3>{label}</h3>
                      <div className="skill-card-scores" role="group" aria-label={`${label}: ${t.rating}`}>
                        {SCALE.map((item) => {
                          const selected = score === item.score;
                          return (
                            <button
                              key={item.score}
                              type="button"
                              className={selected ? "is-selected" : ""}
                              style={
                                selected
                                  ? { background: item.fill, color: item.ink }
                                  : undefined
                              }
                              aria-pressed={selected}
                              aria-label={`${label}: ${item.score} · ${locale === "vi" ? item.vi : item.en}`}
                              disabled={blocked}
                              onClick={() => setScore(skill.id, item.score)}
                            >
                              {item.score}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>

          <div className="matrix-bottom">
          <section className="matrix-radar" aria-labelledby="skill-radar-title">
            <div className="matrix-radar-copy">
              <h2 id="skill-radar-title">{t.radarTitle}</h2>
              <p>{t.radarHint}</p>
            </div>
            <SkillRadar
              items={scores.map((item) => ({
                id: item.id,
                label: GROUP_META[item.id][locale],
                value: item.total === 0 ? 0 : item.achieved / item.total,
                percent: item.percent,
                color: GROUP_META[item.id].bg,
                ink: GROUP_META[item.id].ink,
                answered: item.answered,
                total: item.total,
              }))}
              overallPercent={overall.percent}
              overallLabel={t.overall}
              emptyLabel={t.radarEmpty}
              hasData={answeredCount > 0}
            />
          </section>

          <section className="matrix-foot">
            <h2>{t.summary}</h2>
            <table className="matrix-overall">
              <thead>
                <tr>
                  <th>{t.skillGroup}</th>
                  <th>{t.maxPoints}</th>
                  <th>{t.achieved}</th>
                  <th>{t.percentage}</th>
                  <th>{t.evaluation}</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((item) => (
                  <tr key={item.id}>
                    <th style={{ background: GROUP_META[item.id].bg }}>{GROUP_META[item.id][locale]}</th>
                    <td>{item.max}</td>
                    <td className="is-hot">{item.answered ? item.achieved : t.pending}</td>
                    <td className="is-hot">{item.answered ? `${item.percent}%` : t.pending}</td>
                    <td>{item.answered ? t.evals[item.eval] : t.pending}</td>
                  </tr>
                ))}
                <tr className="is-overall">
                  <th>{t.overall}</th>
                  <td>{overall.max}</td>
                  <td className="is-hot">{answeredCount ? overall.achieved : t.pending}</td>
                  <td className="is-hot">{answeredCount ? `${overall.percent}%` : t.pending}</td>
                  <td>{answeredCount ? t.evals[overall.eval] : t.pending}</td>
                </tr>
              </tbody>
            </table>
            <p className="matrix-extrema">
              <span>
                {t.strongest}: {overall.strongest ? GROUP_META[overall.strongest.id][locale] : t.pending}
              </span>
              <span>
                {t.lowest}: {overall.lowest ? GROUP_META[overall.lowest.id][locale] : t.pending}
              </span>
            </p>
            <div className="matrix-actions">
              <button type="button" className="button button-ghost-dark" onClick={clearAnswers} disabled={blocked}>
                {t.reset}
              </button>
              <button type="button" className="button button-ghost-dark" onClick={downloadJson} disabled={blocked}>
                {t.download}
              </button>
              <button type="button" className="button button-primary" onClick={printPdf}>
                {t.printPdf}
              </button>
            </div>
          </section>
          </div>
        </section>
      </div>
      {tip ? (
        <div
          className={tip.y < 88 ? "matrix-tip is-below" : "matrix-tip"}
          style={{ left: tip.x, top: tip.y, borderLeftColor: tip.fill === "#ffffff" ? "#9aa4b2" : tip.fill }}
          role="tooltip"
        >
          <strong>{tip.title}</strong>
          <span>{tip.desc}</span>
        </div>
      ) : null}
    </main>
  );
}
