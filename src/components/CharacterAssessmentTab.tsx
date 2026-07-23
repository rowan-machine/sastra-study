"use client";

import { CharacterAssessment, AssessmentAnswer, GunaResponse, ScheduleDay, JapaEntry, DailyLogEntry, Settings } from "@/lib/data";
import { useState, useMemo } from "react";
import { CheckCircle2, ChevronRight, RotateCcw, BarChart3, Shield, Flame, Moon, Star, ArrowRight, History, Heart, BookOpen, Users, Sparkles } from "lucide-react";
import { format } from "date-fns";

// ── Scenario definitions ──
// Each scenario presents a realistic situation and 3 choices mapping to sattva / rajas / tamas.
// Grouped by devotee quality so the assessment covers a broad range of character traits.

interface ScenarioChoice {
  id: string;
  text: string;
  guna: GunaResponse;
}

interface Scenario {
  id: string;
  quality: string;       // e.g. "Tolerance", "Humility"
  qualityRef: string;    // BG / SB reference
  situation: string;
  choices: ScenarioChoice[];
}

const scenarios: Scenario[] = [
  // ── Tolerance (titikṣā) ──
  {
    id: "tol-1",
    quality: "Tolerance (titikṣā)",
    qualityRef: "BG 2.14",
    situation: "A devotee publicly criticizes your service in front of the community, pointing out a mistake you made during the program.",
    choices: [
      { id: "tol-1a", text: "I feel hurt but try to take the feedback gracefully, considering whether there is truth in it. I look for what I can learn.", guna: "sattva" },
      { id: "tol-1b", text: "I pause and ask for a private conversation later. I want to understand their concern and see if I can correct what happened.", guna: "sattva" },
      { id: "tol-1c", text: "I defend myself immediately and explain why I did what I did. I make sure others hear my side of the story.", guna: "rajas" },
      { id: "tol-1d", text: "I feel unfairly singled out and push back, pointing out that others make mistakes too.", guna: "rajas" },
      { id: "tol-1e", text: "I shut down, stop volunteering, and avoid that person. The whole experience makes me lose interest in serving.", guna: "tamas" },
      { id: "tol-1f", text: "I feel embarrassed and quietly stop showing up. I tell myself the devotees are too critical.", guna: "tamas" },
    ],
  },
  {
    id: "tol-2",
    quality: "Tolerance (titikṣā)",
    qualityRef: "BG 12.13",
    situation: "You wake up sick on a day when you committed to attend an important program. Your body hurts and you feel exhausted.",
    choices: [
      { id: "tol-2a", text: "I chant my rounds at home carefully and do what I can. I accept the discomfort without complaining and adjust my schedule mindfully.", guna: "sattva" },
      { id: "tol-2b", text: "I rest as needed, but I still chant my minimum rounds and read a little. I don't let the day become wasted.", guna: "sattva" },
      { id: "tol-2c", text: "I push through and attend anyway, even though I'm irritable. I let everyone know how hard it was for me to come.", guna: "rajas" },
      { id: "tol-2d", text: "I attend for a short time and then leave, feeling frustrated that I can't do more.", guna: "rajas" },
      { id: "tol-2e", text: "I use the illness as an excuse to skip everything — rounds, study, service. I watch videos and sleep all day.", guna: "tamas" },
      { id: "tol-2f", text: "I feel too weak to do anything spiritual and spend the day distracting myself, telling myself I'll restart tomorrow.", guna: "tamas" },
    ],
  },
  // ── Humility (amānitva) ──
  {
    id: "hum-1",
    quality: "Humility (amānitva)",
    qualityRef: "BG 13.8",
    situation: "A newer devotee is asked to lead the class instead of you, even though you have been studying longer and know the material better.",
    choices: [
      { id: "hum-1a", text: "I am genuinely happy for them. I sit in the audience, listen attentively, and afterwards offer encouragement and any helpful feedback if asked.", guna: "sattva" },
      { id: "hum-1b", text: "I appreciate the opportunity to learn from a fresh perspective. I support them and offer help if they want it.", guna: "sattva" },
      { id: "hum-1c", text: "I attend but can't help comparing their presentation to what I would have done. I feel it's unfair and consider mentioning my qualifications to the organizer.", guna: "rajas" },
      { id: "hum-1d", text: "I attend but feel a little overlooked. I mention to someone that I have more experience, just in case.", guna: "rajas" },
      { id: "hum-1e", text: "I don't attend. If they don't appreciate my experience, why should I bother showing up?", guna: "tamas" },
      { id: "hum-1f", text: "I feel slighted and spend the time with other devotees complaining about the decision.", guna: "tamas" },
    ],
  },
  {
    id: "hum-2",
    quality: "Humility (amānitva)",
    qualityRef: "CC Ādi 17.31",
    situation: "Someone asks you a question about a topic you just studied, and you realize you don't remember the answer clearly.",
    choices: [
      { id: "hum-2a", text: "I honestly say I'm not sure and suggest we look it up together. I see it as a chance to review and deepen my understanding.", guna: "sattva" },
      { id: "hum-2b", text: "I say I'm not certain, but I share what I do remember and offer to verify it.", guna: "sattva" },
      { id: "hum-2c", text: "I give a confident-sounding answer based on what I vaguely remember, because I don't want to look uninformed.", guna: "rajas" },
      { id: "hum-2d", text: "I make an educated guess and present it as what I recall, hoping it is correct.", guna: "rajas" },
      { id: "hum-2e", text: "I change the subject or deflect. I feel embarrassed and annoyed at myself, and it discourages me from studying further.", guna: "tamas" },
      { id: "hum-2f", text: "I pretend I didn't hear the question and avoid the topic.", guna: "tamas" },
    ],
  },
  // ── Compassion (dayā) ──
  {
    id: "com-1",
    quality: "Compassion (dayā)",
    qualityRef: "SB 3.25.21",
    situation: "A devotee who has been struggling confides in you that they are thinking of leaving the community because they feel they don't belong.",
    choices: [
      { id: "com-1a", text: "I listen with full attention, validate their feelings, and gently share my own struggles. I offer to spend more time with them and help them reconnect.", guna: "sattva" },
      { id: "com-1b", text: "I listen and invite them to a program or for a meal, trying to keep the connection warm and genuine.", guna: "sattva" },
      { id: "com-1c", text: "I quickly give them advice about what they should be doing differently — more chanting, more service — and remind them about the consequences of leaving.", guna: "rajas" },
      { id: "com-1d", text: "I tell them what has helped me, but I can tell I'm more focused on fixing them than hearing them.", guna: "rajas" },
      { id: "com-1e", text: "I nod sympathetically but don't follow up. I have my own problems, and getting involved in someone else's crisis feels overwhelming.", guna: "tamas" },
      { id: "com-1f", text: "I think it's probably their own fault and keep my distance.", guna: "tamas" },
    ],
  },
  // ── Cleanliness (śauca) ──
  {
    id: "cln-1",
    quality: "Cleanliness (śauca)",
    qualityRef: "BG 13.8, BG 16.1-3",
    situation: "You've been scrolling social media for the past hour when you had planned to study and chant. No one knows.",
    choices: [
      { id: "cln-1a", text: "I honestly acknowledge to myself what happened, put the phone away, and start my practice now without self-condemnation. I consider adjusting my habits to prevent this tomorrow.", guna: "sattva" },
      { id: "cln-1b", text: "I put the phone away, take a few minutes to reset, and do what I can of my practice. I try not to dwell on it.", guna: "sattva" },
      { id: "cln-1c", text: "I feel guilty but bargain with myself: 'I'll do extra tomorrow.' I keep scrolling for another 10 minutes.", guna: "rajas" },
      { id: "cln-1d", text: "I keep scrolling but plan to make up the time later. I feel anxious but don't stop yet.", guna: "rajas" },
      { id: "cln-1e", text: "I think, 'The day is already wasted, so what's the point?' I give up on my practice for today.", guna: "tamas" },
      { id: "cln-1f", text: "I feel bad but keep watching anyway. I tell myself I just need to unwind.", guna: "tamas" },
    ],
  },
  // ── Determination (dhṛti) ──
  {
    id: "det-1",
    quality: "Determination (dhṛti)",
    qualityRef: "BG 18.33",
    situation: "You've been trying to wake up for maṅgala-āratī for two weeks but have overslept every day. You feel like a failure.",
    choices: [
      { id: "det-1a", text: "I analyze what's going wrong (sleeping too late, alarm placement, etc.) and make one practical adjustment. I remind myself that gradual progress is still progress.", guna: "sattva" },
      { id: "det-1b", text: "I set one alarm and go to bed a bit earlier. I try once more and keep it simple.", guna: "sattva" },
      { id: "det-1c", text: "I set three alarms, tell everyone I'll be there, and force myself through willpower. If I fail again, I'll feel terrible.", guna: "rajas" },
      { id: "det-1d", text: "I make a dramatic plan to wake up extra early and punish myself if I don't. I announce it to others.", guna: "rajas" },
      { id: "det-1e", text: "I decide I'm just not a morning person and stop trying. The goal was unrealistic anyway.", guna: "tamas" },
      { id: "det-1f", text: "I keep hitting snooze and tell myself it's not that important. I stop setting the alarm.", guna: "tamas" },
    ],
  },
  // ── Non-enviousness (anasūyā) ──
  {
    id: "env-1",
    quality: "Non-envy (anasūyā)",
    qualityRef: "BG 18.71",
    situation: "A devotee your age has memorized far more verses than you, gives excellent classes, and everyone praises them. You feel a twinge in your heart.",
    choices: [
      { id: "env-1a", text: "I recognize the feeling, offer it to Kṛṣṇa, and genuinely appreciate their advancement. I let their example inspire my own practice without comparing.", guna: "sattva" },
      { id: "env-1b", text: "I feel a small pang but then ask them how they study. I take one tip from them and apply it.", guna: "sattva" },
      { id: "env-1c", text: "I feel competitive and start studying harder to catch up. I subtly point out areas where I'm better than them.", guna: "rajas" },
      { id: "env-1d", text: "I compare myself to them and feel a rush to do more. I notice my study becomes about proving myself.", guna: "rajas" },
      { id: "env-1e", text: "I dismiss their accomplishment ('They're just showing off') and lose motivation in my own study.", guna: "tamas" },
      { id: "env-1f", text: "I feel discouraged and think I will never be a good devotee. I stop trying for a few days.", guna: "tamas" },
    ],
  },
  // ── Gratitude (kṛtajñatā) ──
  {
    id: "gra-1",
    quality: "Gratitude (kṛtajñatā)",
    qualityRef: "SB 1.6.26",
    situation: "A senior devotee who has guided you receives recognition for their years of service. You recall they were sometimes strict with you.",
    choices: [
      { id: "gra-1a", text: "I feel deep gratitude, remembering that their strictness helped me grow. I approach them personally to express my thanks and appreciation.", guna: "sattva" },
      { id: "gra-1b", text: "I offer a sincere compliment and try to focus on what they did right. I let the past difficulties fade.", guna: "sattva" },
      { id: "gra-1c", text: "I acknowledge it publicly because it's the right thing to do, but internally I still hold some resentment about the difficult moments.", guna: "rajas" },
      { id: "gra-1d", text: "I congratulate them but can't help mentioning the times they were hard on me. I want others to know the full picture.", guna: "rajas" },
      { id: "gra-1e", text: "I think, 'They don't deserve it — they were unfair to me.' I keep my distance and feel bitter.", guna: "tamas" },
      { id: "gra-1f", text: "I feel they hurt me too much and I don't want to celebrate them. I avoid the event.", guna: "tamas" },
    ],
  },
  // ── Simplicity (ārjava) ──
  {
    id: "sim-1",
    quality: "Simplicity (ārjava)",
    qualityRef: "BG 16.1",
    situation: "You are asked how your sādhana is going. Honestly, you have been inconsistent this week.",
    choices: [
      { id: "sim-1a", text: "I answer honestly: 'It has been a difficult week. I've been inconsistent but I'm trying to get back on track.' I don't exaggerate either way.", guna: "sattva" },
      { id: "sim-1b", text: "I answer mostly honestly, though I keep the details brief. I don't pretend everything is perfect.", guna: "sattva" },
      { id: "sim-1c", text: "I give a vague positive answer — 'Oh, it's going' — and steer the conversation elsewhere. I don't want anyone to think less of me.", guna: "rajas" },
      { id: "sim-1d", text: "I make it sound better than it is. I mention one good thing and avoid the rest.", guna: "rajas" },
      { id: "sim-1e", text: "I lie and say it's going well. If they knew the truth they would judge me.", guna: "tamas" },
      { id: "sim-1f", text: "I feel ashamed and say nothing. I change the subject and avoid the person.", guna: "tamas" },
    ],
  },
  // ── Renunciation (tyāga) ──
  {
    id: "ren-1",
    quality: "Renunciation (tyāga)",
    qualityRef: "BG 18.2",
    situation: "An opportunity arises for a well-paying project that would require you to work during your study and sādhana time for the next month.",
    choices: [
      { id: "ren-1a", text: "I carefully consider whether the money is truly needed, and if not, I decline. If needed, I restructure my schedule to protect at least the core practices.", guna: "sattva" },
      { id: "ren-1b", text: "I take the job but set clear boundaries so I can still do my rounds and read a little each day.", guna: "sattva" },
      { id: "ren-1c", text: "I take it immediately — the extra money will let me do bigger things later. I'll catch up on sādhana next month.", guna: "rajas" },
      { id: "ren-1d", text: "I take the project and feel torn, but I convince myself I can handle it. I end up squeezing my practice out.", guna: "rajas" },
      { id: "ren-1e", text: "I don't even consider my practice. Money is money, and spiritual life can wait.", guna: "tamas" },
      { id: "ren-1f", text: "I feel I have no choice because of bills. I tell myself Kṛṣṇa will understand and stop doing my minimum.", guna: "tamas" },
    ],
  },
  // ── Association (sādhu-saṅga) ──
  {
    id: "san-1",
    quality: "Association (sādhu-saṅga)",
    qualityRef: "SB 11.2.30",
    situation: "It's the weekend. You can either attend a devotee gathering or spend the evening with non-devotee friends at a restaurant.",
    choices: [
      { id: "san-1a", text: "I attend the devotee gathering with genuine enthusiasm. I can see my other friends another time in a setting where I can maintain my principles.", guna: "sattva" },
      { id: "san-1b", text: "I attend the devotee gathering and plan to meet my friends briefly afterward in a way that won't compromise my principles.", guna: "sattva" },
      { id: "san-1c", text: "I try to do both — rush through the devotee event and then join the restaurant. I end up stressed and distracted at both.", guna: "rajas" },
      { id: "san-1d", text: "I attend the devotee gathering but keep checking my phone, thinking about the other plans.", guna: "rajas" },
      { id: "san-1e", text: "I skip the devotee gathering. The restaurant sounds more fun, and I deserve a break.", guna: "tamas" },
      { id: "san-1f", text: "I go with my friends and tell myself it's not a big deal. I don't think about my principles while I'm there.", guna: "tamas" },
    ],
  },
];

// ── Shuffle helper ──
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Props ──
interface Props {
  assessments: CharacterAssessment[];
  setAssessments: (val: CharacterAssessment[] | ((prev: CharacterAssessment[]) => CharacterAssessment[])) => void;
  scheduleLog?: ScheduleDay[];
  japaLog?: JapaEntry[];
  dailyLog?: DailyLogEntry[];
  settings?: Settings;
}

function getReadiness({ assessments, scheduleLog = [], japaLog = [], dailyLog = [], settings }: { assessments: CharacterAssessment[]; scheduleLog?: ScheduleDay[]; japaLog?: JapaEntry[]; dailyLog?: DailyLogEntry[]; settings?: Settings }) {
  const latest = assessments[0];
  const sattva = latest ? latest.sattvaScore : 0;

  const recentDays = 30;
  const now = new Date();
  const recentSchedule = scheduleLog.filter((s) => {
    const d = new Date(s.date);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= recentDays;
  });

  const recentJapa = japaLog.filter((j) => {
    const d = new Date(j.date);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= recentDays;
  });

  const recentLog = dailyLog.filter((l) => {
    const d = new Date(l.date);
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= recentDays;
  });

  const regCount = recentSchedule.filter((s) => s.noMeatEating && s.noIntoxication && s.noGambling && s.noIllicitSex && s.sixteenRounds).length;
  const regTotal = Math.max(recentSchedule.length, 1);
  const regPct = Math.round((regCount / regTotal) * 100);

  const japaCount = recentJapa.filter((j) => (j.rounds ?? 0) >= 16).length;
  const japaTotal = Math.max(recentJapa.length, 1);
  const japaPct = Math.round((japaCount / japaTotal) * 100);

  const aratiCount = recentSchedule.filter((s) => s.mangalaArati).length;
  const aratiPct = Math.round((aratiCount / regTotal) * 100);

  const studyHours = recentLog.reduce((sum, l) => sum + (l.hours != null ? l.hours : (l.minutes != null ? l.minutes / 60 : 0)), 0);
  const studyDays = Math.max(recentLog.length, 1);
  const avgStudy = studyHours / studyDays;
  const targetStudy = settings?.minimumDailyStudyHours ?? 1.5;
  const studyPct = Math.min(100, Math.round((avgStudy / targetStudy) * 100));

  const factors = [
    { label: "Sattva (character)", pct: sattva, icon: <Sparkles size={14} />, threshold: 60 },
    { label: "Regulative principles", pct: regPct, icon: <Shield size={14} />, threshold: 80 },
    { label: "16 rounds", pct: japaPct, icon: <Flame size={14} />, threshold: 80 },
    { label: "Study", pct: studyPct, icon: <BookOpen size={14} />, threshold: 80 },
    { label: "Maṅgala āratī", pct: aratiPct, icon: <Heart size={14} />, threshold: 70 },
  ];

  const overall = Math.round(factors.reduce((sum, f) => sum + f.pct, 0) / factors.length);

  return { factors, overall };
}

export function CharacterAssessmentTab({ assessments, setAssessments, scheduleLog = [], japaLog = [], dailyLog = [], settings }: Props) {
  const [mode, setMode] = useState<"home" | "assessment" | "results">("home");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [shuffledScenarios, setShuffledScenarios] = useState<Scenario[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const startAssessment = () => {
    const shuffled = shuffleArray(scenarios).map((s) => ({
      ...s,
      choices: shuffleArray(s.choices),
    }));
    setShuffledScenarios(shuffled);
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedChoice(null);
    setMode("assessment");
  };

  const selectChoice = (scenario: Scenario, choice: ScenarioChoice) => {
    setSelectedChoice(choice.id);
    // Delay to show selection before moving to next
    setTimeout(() => {
      const answer: AssessmentAnswer = {
        scenarioId: scenario.id,
        choiceId: choice.id,
        guna: choice.guna,
        answeredAt: new Date().toISOString(),
      };
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (currentIdx < shuffledScenarios.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setSelectedChoice(null);
      } else {
        // Assessment complete — score and save
        const s = newAnswers.filter((a) => a.guna === "sattva").length;
        const r = newAnswers.filter((a) => a.guna === "rajas").length;
        const t = newAnswers.filter((a) => a.guna === "tamas").length;
        const total = newAnswers.length;
        const assessment: CharacterAssessment = {
          id: `ca-${Date.now()}`,
          date: format(new Date(), "yyyy-MM-dd"),
          answers: newAnswers,
          sattvaScore: Math.round((s / total) * 100),
          rajasScore: Math.round((r / total) * 100),
          tamasScore: Math.round((t / total) * 100),
        };
        setAssessments((prev) => [assessment, ...prev]);
        setMode("results");
      }
    }, 400);
  };

  const latestAssessment = assessments[0] || null;

  const readiness = useMemo(
    () => getReadiness({ assessments, scheduleLog, japaLog, dailyLog, settings }),
    [assessments, scheduleLog, japaLog, dailyLog, settings]
  );

  // Quality breakdown for latest assessment
  const qualityBreakdown = useMemo(() => {
    if (!latestAssessment) return [];
    const map = new Map<string, { quality: string; guna: GunaResponse }>();
    for (const ans of latestAssessment.answers) {
      const sc = scenarios.find((s) => s.id === ans.scenarioId);
      if (sc) map.set(sc.quality, { quality: sc.quality, guna: ans.guna });
    }
    return Array.from(map.values());
  }, [latestAssessment]);

  // ── HOME VIEW ──
  if (mode === "home") {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="text-amber-600" size={24} />
            Character Self-Assessment
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Scenario-based reflection on the gunas and qualities of a Vaisnava.
            Honest answers reveal where sattva, rajas, and tamas actually influence your character.
          </p>
        </div>

        {/* Initiation readiness */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/30 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Shield size={18} />
              Initiation Readiness
            </h3>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{readiness.overall}%</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-amber-700 dark:text-amber-400">
              <span>Overall readiness</span>
              <span>{readiness.overall >= 75 ? "Ready" : readiness.overall >= 50 ? "Growing" : "Needs attention"}</span>
            </div>
            <div className="h-2.5 bg-amber-200 dark:bg-amber-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${readiness.overall}%` }} />
            </div>
          </div>

          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Initiation is both a commitment and a blessing. The strongest foundation is stable practice: regulative principles, chanting, study, morning sādhana, and a sattvic character. These numbers reflect the last 30 days.
          </p>

          <div className="space-y-2">
            {readiness.factors.map((f) => {
              const pass = f.pct >= f.threshold;
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${pass ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"}`}>
                    {f.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300">{f.label}</span>
                      <span className={pass ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{f.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pass ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startAssessment}
          className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Star size={20} />
          {latestAssessment ? "Take New Assessment" : "Begin Assessment"}
          <ArrowRight size={18} />
        </button>

        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
          {scenarios.length} scenarios covering {new Set(scenarios.map((s) => s.quality)).size} devotee qualities.
          Takes about 5-8 minutes. Scenarios are shuffled each time.
        </p>

        {/* Latest results summary */}
        {latestAssessment && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Latest Assessment</h3>
              <span className="text-xs text-zinc-400">{latestAssessment.date}</span>
            </div>

            {/* Guna bars */}
            <div className="space-y-2">
              <GunaBar label="Sattva" pct={latestAssessment.sattvaScore} color="bg-emerald-500" icon={<Shield size={14} />} />
              <GunaBar label="Rajas" pct={latestAssessment.rajasScore} color="bg-rose-500" icon={<Flame size={14} />} />
              <GunaBar label="Tamas" pct={latestAssessment.tamasScore} color="bg-slate-500" icon={<Moon size={14} />} />
            </div>

            {/* Quality breakdown */}
            <div className="space-y-1 pt-2">
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Quality Breakdown</h4>
              {qualityBreakdown.map(({ quality, guna }) => (
                <div key={quality} className="flex items-center justify-between text-sm py-1">
                  <span className="text-zinc-700 dark:text-zinc-300">{quality}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    guna === "sattva"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : guna === "rajas"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {guna === "sattva" ? "Goodness" : guna === "rajas" ? "Passion" : "Ignorance"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {assessments.length > 1 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-5 space-y-3">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <History size={16} />
              Assessment History
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {assessments.map((a, i) => (
                <div key={a.id} className={`flex items-center justify-between text-sm py-2 px-3 rounded-lg ${i === 0 ? "bg-amber-50 dark:bg-amber-900/10" : "bg-zinc-50 dark:bg-zinc-700/30"}`}>
                  <span className="text-zinc-600 dark:text-zinc-400">{a.date}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600">S {a.sattvaScore}%</span>
                    <span className="text-rose-600">R {a.rajasScore}%</span>
                    <span className="text-slate-500">T {a.tamasScore}%</span>
                  </div>
                </div>
              ))}
            </div>
            {assessments.length >= 3 && (
              <TrendSummary assessments={assessments} />
            )}
          </div>
        )}
      </div>
    );
  }

  // ── ASSESSMENT VIEW ──
  if (mode === "assessment" && shuffledScenarios.length > 0) {
    const scenario = shuffledScenarios[currentIdx];
    const progress = ((currentIdx) / shuffledScenarios.length) * 100;

    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{currentIdx + 1} of {shuffledScenarios.length}</span>
            <span className="text-amber-600 font-medium">{scenario.quality}</span>
          </div>
          <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Scenario card */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{scenario.qualityRef}</p>
          <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{scenario.situation}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          {scenario.choices.map((choice) => {
            const isSelected = selectedChoice === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => !selectedChoice && selectChoice(scenario, choice)}
                disabled={!!selectedChoice}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? choice.guna === "sattva"
                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-300"
                      : choice.guna === "rajas"
                        ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20 ring-2 ring-rose-300"
                        : "border-slate-400 bg-slate-50 dark:bg-slate-800 ring-2 ring-slate-300"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
                } ${selectedChoice && !isSelected ? "opacity-40" : ""}`}
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{choice.text}</p>
                {isSelected && (
                  <p className={`text-xs mt-2 font-medium ${
                    choice.guna === "sattva" ? "text-emerald-600" : choice.guna === "rajas" ? "text-rose-600" : "text-slate-500"
                  }`}>
                    {choice.guna === "sattva" ? "Mode of Goodness" : choice.guna === "rajas" ? "Mode of Passion" : "Mode of Ignorance"}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center italic">
          Answer honestly — this is between you and Krsna. There is no passing or failing.
        </p>
      </div>
    );
  }

  // ── RESULTS VIEW ──
  if (mode === "results" && latestAssessment) {
    const s = latestAssessment.sattvaScore;
    const r = latestAssessment.rajasScore;
    const t = latestAssessment.tamasScore;
    const dominant = s >= r && s >= t ? "sattva" : r >= t ? "rajas" : "tamas";

    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle2 className="mx-auto text-amber-600" size={48} />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Assessment Complete</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your responses reveal the influence of the three modes on your character.
          </p>
        </div>

        {/* Guna scores */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-4">
          <GunaBar label="Sattva (Goodness)" pct={s} color="bg-emerald-500" icon={<Shield size={14} />} />
          <GunaBar label="Rajas (Passion)" pct={r} color="bg-rose-500" icon={<Flame size={14} />} />
          <GunaBar label="Tamas (Ignorance)" pct={t} color="bg-slate-500" icon={<Moon size={14} />} />
        </div>

        {/* Interpretation */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-3">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Reflection</h3>
          {dominant === "sattva" && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Your responses indicate a predominance of <strong className="text-emerald-600">sattva-guna</strong>. You tend toward patience, honest self-reflection, and genuine concern for others.</p>
              <p>Srila Prabhupada explains that the mode of goodness conditions one to happiness (BG 14.6). Continue cultivating this through association, study, and practice — but beware of subtle pride in one&apos;s own goodness.</p>
              {r > 20 && <p>Watch the rajasic tendencies ({r}%) — competitiveness and the desire for recognition can masquerade as enthusiasm.</p>}
              {t > 10 && <p>The tamasic responses ({t}%) suggest areas where discouragement or avoidance creep in. Bring these to the light through honest association.</p>}
            </div>
          )}
          {dominant === "rajas" && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Your responses show a strong influence of <strong className="text-rose-600">rajo-guna</strong>. You tend toward action, but it&apos;s often driven by ego, comparison, or the desire for results.</p>
              <p>&ldquo;The mode of passion is born of unlimited desires and longings, and because of this the embodied living entity is bound to material fruitive actions.&rdquo; (BG 14.7)</p>
              <p>The antidote is deliberate association with sattva: early rising, regulated eating, quality hearing, and honest relationships with advanced devotees who can help you see your own patterns.</p>
            </div>
          )}
          {dominant === "tamas" && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>Your responses reveal a significant influence of <strong className="text-slate-500">tamo-guna</strong> — withdrawal, avoidance, and loss of motivation.</p>
              <p>&ldquo;O son of Bharata, know that the mode of darkness, born of ignorance, is the delusion of all embodied living entities. The results of this mode are madness, indolence, and sleep.&rdquo; (BG 14.8)</p>
              <p>This is not a condemnation — it is a diagnosis. The prescription is immediate, practical action: attend one program this week, chant at least one round with attention, and reach out to one devotee. Tamas is broken by even small acts of sattva.</p>
            </div>
          )}
        </div>

        {/* Quality-by-quality */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 space-y-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Quality-by-Quality</h3>
          {latestAssessment.answers.map((ans) => {
            const sc = scenarios.find((s) => s.id === ans.scenarioId);
            if (!sc) return null;
            return (
              <div key={ans.scenarioId} className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                <span className="text-zinc-700 dark:text-zinc-300">{sc.quality}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  ans.guna === "sattva"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : ans.guna === "rajas"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {ans.guna === "sattva" ? "Goodness" : ans.guna === "rajas" ? "Passion" : "Ignorance"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setMode("home")}
            className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 size={16} />
            View History
          </button>
          <button
            onClick={startAssessment}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Retake
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Guna Bar ──
function GunaBar({ label, pct, color, icon }: { label: string; pct: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
          {icon} {label}
        </span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</span>
      </div>
      <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Trend Summary ──
function TrendSummary({ assessments }: { assessments: CharacterAssessment[] }) {
  const recent = assessments.slice(0, 3);
  const older = assessments.slice(3, 6);
  if (older.length === 0) return null;

  const recentAvg = Math.round(recent.reduce((s, a) => s + a.sattvaScore, 0) / recent.length);
  const olderAvg = Math.round(older.reduce((s, a) => s + a.sattvaScore, 0) / older.length);
  const diff = recentAvg - olderAvg;

  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center pt-2">
      {diff > 5
        ? `Sattva trending up (+${diff}%) — your character is developing.`
        : diff < -5
          ? `Sattva trending down (${diff}%) — reflect on what has changed.`
          : "Sattva is stable — keep cultivating consistency."}
    </p>
  );
}
