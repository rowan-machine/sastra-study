import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StudyTimer } from "@/components/StudyTimer";
import { TimerProvider } from "@/components/TimerProvider";
import { timerStore } from "@/lib/timer";
import { defaultSettings, DailyLogEntry, CurriculumWeek } from "@/lib/data";

const today = "2026-07-09";
const systemTime = new Date(2026, 6, 9, 12, 0, 0);
const curriculum: CurriculumWeek[] = [
  {
    week: 1,
    book: "Bhagavad-gītā As It Is",
    assignment: "Chapters 1-3",
    targetHours: 5,
    actualHours: 0,
    startDate: "2026-07-06",
    endDate: "2026-07-12",
    complete: false,
    reflection: false,
    paceStatus: "on-track",
    notes: "",
  },
];

const settings = {
  ...defaultSettings,
  planStartDate: "2026-07-06",
  minimumDailyStudyHours: 1,
  weekendTargetHours: 2,
};

function renderTimer(props: Partial<Parameters<typeof StudyTimer>[0]> = {}) {
  const dailyLog: DailyLogEntry[] = props.dailyLog ?? [];
  const setDailyLog = vi.fn((value) => {
    if (typeof value === "function") {
      value(dailyLog);
    }
  });

  return render(
    <TimerProvider>
      <StudyTimer
        dailyLog={dailyLog}
        curriculum={curriculum}
        settings={settings}
        courseBooks={["Bhagavad-gītā As It Is"]}
        {...props}
        setDailyLog={setDailyLog}
      />
    </TimerProvider>
  );
}

describe("StudyTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(systemTime);
    timerStore.stopLoop();
    timerStore.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the timer and reading overview", () => {
    renderTimer();
    expect(screen.getByText("Study Timer")).toBeInTheDocument();
    expect(screen.getByText(/Study Timer/i)).toBeInTheDocument();
    expect(screen.getByText("0:00:00")).toBeInTheDocument();
    expect(screen.getByText(/Today: 1 hrs/i)).toBeInTheDocument();
  });

  it("starts and pauses the timer when the play/pause button is clicked", () => {
    renderTimer();
    const playButton = screen.getByRole("button", { name: /Start timer/i });
    fireEvent.click(playButton);
    expect(screen.getByRole("button", { name: /Pause timer/i })).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("0:00:05")).toBeInTheDocument();

    const pauseButton = screen.getByRole("button", { name: /Pause timer/i });
    fireEvent.click(pauseButton);
    expect(screen.getByRole("button", { name: /Start timer/i })).toBeInTheDocument();
  });

  it("resets the timer", () => {
    renderTimer();
    const playButton = screen.getByRole("button", { name: /Start timer/i });
    fireEvent.click(playButton);
    act(() => { vi.advanceTimersByTime(120000); });
    expect(screen.getByText("0:02:00")).toBeInTheDocument();

    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);
    expect(screen.getByText("0:00:00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start timer/i })).toBeInTheDocument();
  });

  it("adds elapsed time to an existing today log entry", () => {
    const existing: DailyLogEntry = {
      date: today,
      book: "Bhagavad-gītā As It Is",
      startLocation: "",
      endLocation: "",
      minutes: 30,
      hours: 0.5,
      sixteenRounds: false,
      sanskrit: false,
      wordMeanings: false,
      translation: false,
      purport: false,
      marked: false,
      reflection: false,
      dailyStudyComplete: false,
      quote: "",
      realization: "",
      notes: "",
    };

    const setDailyLog = vi.fn((value) => {
      if (typeof value === "function") {
        value([existing]);
      }
    });

    render(
      <TimerProvider>
        <StudyTimer
          dailyLog={[existing]}
          setDailyLog={setDailyLog}
          curriculum={curriculum}
          settings={settings}
          courseBooks={["Bhagavad-gītā As It Is"]}
        />
      </TimerProvider>
    );

    const playButton = screen.getByRole("button", { name: /Start timer/i });
    fireEvent.click(playButton);
    act(() => { vi.advanceTimersByTime(120000); });

    const logButton = screen.getByRole("button", { name: /Log elapsed time/i });
    fireEvent.click(logButton);

    expect(setDailyLog).toHaveBeenCalled();
    const call = setDailyLog.mock.calls[0][0];
    const result = typeof call === "function" ? call([existing]) : call;
    expect(result[0].minutes).toBe(32);
    expect(result[0].hours).toBeCloseTo(32 / 60, 5);
  });

  it("creates a new today log entry when none exists", () => {
    const setDailyLog = vi.fn((value) => {
      if (typeof value === "function") {
        value([]);
      }
    });

    render(
      <TimerProvider>
        <StudyTimer
          dailyLog={[]}
          setDailyLog={setDailyLog}
          curriculum={curriculum}
          settings={settings}
          courseBooks={["Bhagavad-gītā As It Is"]}
        />
      </TimerProvider>
    );

    const playButton = screen.getByRole("button", { name: /Start timer/i });
    fireEvent.click(playButton);
    act(() => { vi.advanceTimersByTime(120000); });

    const logButton = screen.getByRole("button", { name: /Log elapsed time/i });
    fireEvent.click(logButton);

    expect(setDailyLog).toHaveBeenCalled();
    const call = setDailyLog.mock.calls[0][0];
    const result = typeof call === "function" ? call([]) : call;
    expect(result[0].date).toBe(today);
    expect(result[0].minutes).toBe(2);
    expect(result[0].book).toBe("Bhagavad-gītā As It Is");
  });
});
