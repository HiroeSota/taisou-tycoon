import type { Mission } from '../types/game';

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'contract_property',
    stage: 1,
    title: '物件を契約する',
    description: '教室を開く物件と契約し、場所を確保しましょう。',
    completed: false,
    notifiedCompleted: false,
  },
  {
    id: 'create_first_class',
    stage: 2,
    title: '最初のクラスを作る',
    description: '1つ以上のクラスを作成して、会員を受け入れる準備をしましょう。',
    completed: false,
    notifiedCompleted: false,
  },
  {
    id: 'get_5_members',
    stage: 3,
    title: '会員5名を獲得する',
    description: '教室に5名以上の会員を集めましょう。',
    targetValue: 5,
    completed: false,
    notifiedCompleted: false,
  },
  {
    id: 'first_monthly_profit',
    stage: 4,
    title: '最初の月次黒字を出す',
    description: '月次決算で初めて黒字を達成しましょう。',
    completed: false,
    notifiedCompleted: false,
  },
  {
    id: 'three_months_profit',
    stage: 5,
    title: '3ヶ月連続黒字を達成する',
    description: '3ヶ月連続で月次黒字を維持しましょう。',
    targetValue: 3,
    completed: false,
    notifiedCompleted: false,
  },
  {
    id: 'chapter1_clear',
    stage: 5,
    title: 'チャプター1クリア',
    description: '2028年3月の最終評価で全6条件を達成してチャプター1をクリアしましょう。',
    completed: false,
    notifiedCompleted: false,
  },
];

export const CHAPTER1_GOAL = {
  title: 'チャプター1',
  period: '2027年9月 〜 2028年3月',
  objective: '地域に根ざした体操教室を軌道に乗せる',
  evaluationYear: 2028,
  evaluationMonth: 3,
  evaluationWeek: 4,
  evaluationWeekNumber: 27,
  criteria: [
    {
      id: 'three_months_profit',
      label: '3ヶ月連続黒字',
      description: '直近3ヶ月、月次で黒字を維持している',
    },
    {
      id: 'cash_reserve',
      label: '運転資金3ヶ月分',
      description: '月次費用の3倍以上の現金を保有している',
    },
    {
      id: 'retention_rate',
      label: '継続率70%以上',
      description: '会員の月次継続率が70%以上',
    },
    {
      id: 'safety',
      label: '安全インシデント0件',
      description: 'けが・事故ゼロで安全に運営できている',
    },
    {
      id: 'owner_hours',
      label: 'オーナー週40h以内',
      description: 'オーナーの週次稼働時間が40時間以下',
    },
    {
      id: 'members',
      label: '在籍会員5名以上',
      description: '5名以上の会員が継続在籍している',
    },
  ],
};
