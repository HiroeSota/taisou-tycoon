import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { TopBar } from './components/hud/TopBar';
import { BottomNav } from './components/ui/BottomNav';
import { TitleScreen } from './components/screens/TitleScreen';
import { NewGameScreen } from './components/screens/NewGameScreen';
import { CityMap } from './components/map/CityMap';
import { ClassroomView } from './components/classroom/ClassroomView';
import { LessonsScreen } from './components/screens/LessonsScreen';
import { MembersScreen } from './components/screens/MembersScreen';
import { MarketingScreen } from './components/screens/MarketingScreen';
import { StaffScreen } from './components/screens/StaffScreen';
import { FinanceScreen } from './components/screens/FinanceScreen';
import { StrategyScreen } from './components/screens/StrategyScreen';
import { WeekReport } from './components/screens/WeekReport';
import { MonthReport } from './components/screens/MonthReport';
import { MissionScreen } from './components/screens/MissionScreen';
import { Chapter1ResultScreen } from './components/screens/Chapter1ResultScreen';

function App() {
  const {
    currentScreen,
    autoAdvance,
    autoAdvanceSpeed,
    isAdvancing,
    showWeekReport,
    advanceWeek,
    currentDate,
    company,
    setScreen,
    missionToast,
    dismissMissionToast,
    showChapter1Result,
  } = useGameStore();

  // Auto-advance ticker
  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setInterval(() => {
      if (!isAdvancing && !showWeekReport) {
        advanceWeek();
      }
    }, autoAdvanceSpeed);
    return () => clearInterval(timer);
  }, [autoAdvance, autoAdvanceSpeed, isAdvancing, showWeekReport]);

  // Track TopBar height (including TutorialBar) and expose as CSS variable --topbar-h.
  // Re-runs on screen change because TopBar only renders for in-game screens.
  useEffect(() => {
    const el = document.getElementById('topbar-root');
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty('--topbar-h', `${el.offsetHeight}px`);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [currentScreen]);

  // Show month report when week 4 ends
  useEffect(() => {
    if (currentDate.week === 4 && !showWeekReport && currentScreen !== 'month_report' && currentScreen !== 'title' && currentScreen !== 'new_game') {
      if (company.monthlyReports.length > 0) {
        const lastReport = company.monthlyReports[company.monthlyReports.length - 1];
        if (lastReport.year === currentDate.year && lastReport.month === currentDate.month) {
          setScreen('month_report');
        }
      }
    }
  }, [currentDate, company.monthlyReports]);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 pb-16">
        {showChapter1Result ? <Chapter1ResultScreen /> : <ScreenRouter screen={currentScreen} />}
      </main>
      <BottomNav />
      {showWeekReport && <WeekReport />}
      {missionToast && (
        <MissionToast message={missionToast} onDismiss={dismissMissionToast} />
      )}
    </div>
  );
}

function ScreenRouter({ screen }: { screen: string }) {
  switch (screen) {
    case 'title':           return <TitleScreen />;
    case 'new_game':        return <NewGameScreen />;
    case 'map':             return <CityMap />;
    case 'classroom':       return <ClassroomView />;
    case 'menu_lessons':    return <LessonsScreen />;
    case 'menu_members':    return <MembersScreen />;
    case 'menu_marketing':  return <MarketingScreen />;
    case 'menu_staff':      return <StaffScreen />;
    case 'menu_finance':    return <FinanceScreen />;
    case 'menu_strategy':   return <StrategyScreen />;
    case 'menu_missions':   return <MissionScreen />;
    case 'month_report':    return <MonthReport />;
    case 'chapter1_result': return <Chapter1ResultScreen />;
    default:                return <ClassroomView />;
  }
}

function MissionToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 border border-white/20 rounded-2xl px-5 py-3 shadow-xl text-white text-sm font-semibold flex items-center gap-3 max-w-xs text-center"
      onClick={onDismiss}
    >
      {message}
    </div>
  );
}

export default App;
