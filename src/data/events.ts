import type { GameEvent } from '../types/game';

export const RANDOM_EVENTS: GameEvent[] = [
  // === Good Events ===
  {
    id: 'sns_viral',
    type: 'good',
    title: 'SNS投稿が話題に！',
    description: 'レッスンの様子を投稿したSNSが地域で拡散されました。問い合わせが急増しています！',
    autoEffect: { members: 3, satisfaction: 5, reputation: 8, message: '今週の体験申込が増えています' },
  },
  {
    id: 'word_of_mouth',
    type: 'good',
    title: '口コミが広がっています',
    description: '会員の保護者から「逆上がりができるようになった」と周囲に伝えてもらいました。',
    autoEffect: { members: 2, satisfaction: 3, reputation: 5 },
  },
  {
    id: 'local_paper',
    type: 'good',
    title: '地域紙に掲載',
    description: '地元のフリーペーパーに教室の紹介記事が載りました。認知度が上がりました。',
    autoEffect: { reputation: 10, members: 1 },
  },
  {
    id: 'kids_achievement',
    type: 'good',
    title: '生徒の成長が話題に！',
    description: '会員の子どもが学校の体育で活躍し、保護者間で口コミが広がっています。',
    autoEffect: { satisfaction: 8, reputation: 5, members: 2 },
  },

  // === Bad Events ===
  {
    id: 'competitor_opens',
    type: 'bad',
    title: '新しい競合教室が開業',
    description: 'エリア内に新しい体操教室がオープンしました。体験キャンペーンで集客を始めています。',
    autoEffect: { members: -2, reputation: -3 },
  },
  {
    id: 'venue_price_up',
    type: 'bad',
    title: '会場利用料が値上がり',
    description: '施設側から来月より会場利用料を10%値上げする連絡が届きました。',
    autoEffect: { cash: -8000, message: '月あたりの会場費が上昇します' },
  },
  {
    id: 'weather_cancellation',
    type: 'bad',
    title: '悪天候でレッスン欠席',
    description: '今週は雨が続き、遠方からの会員の欠席が目立ちました。',
    autoEffect: { satisfaction: -5 },
  },
  {
    id: 'equipment_check',
    type: 'bad',
    title: '設備点検が必要',
    description: 'マットのつなぎ目が劣化し、安全点検が必要です。',
    autoEffect: { cash: -15000, message: '修繕費が発生しました' },
  },

  // === Choice Events ===
  {
    id: 'instructor_request',
    type: 'choice',
    title: '講師から相談：契約条件の変更',
    description: '担当講師から「月謝値上げに合わせて報酬も上げてほしい」と相談が来ました。',
    choices: [
      {
        label: '報酬を上げる（+2,000円/週）',
        description: 'モチベーションが向上し、指導品質が上がります',
        effect: { cash: -2000, satisfaction: 5, message: '講師のモチベーションが上がりました' },
      },
      {
        label: '現状維持',
        description: '講師のモチベーションが少し下がります',
        effect: { satisfaction: -8, message: '講師は不満を抱えているようです' },
      },
    ],
  },
  {
    id: 'full_class_request',
    type: 'choice',
    title: '人気クラスが満員に！',
    description: '土曜日のクラスが満員で、追加の体験予約が断られています。',
    choices: [
      {
        label: 'クラスを増設する',
        description: '新しいクラスを追加して受け入れを増やす（講師の稼働に注意）',
        effect: { members: 3, message: 'クラス増設メニューを確認してください' },
      },
      {
        label: 'キャンセル待ちリストに',
        description: '無理せず待機リストで管理する',
        effect: { satisfaction: 3, message: '計画的に対応することができました' },
      },
    ],
  },
  {
    id: 'fee_change_feedback',
    type: 'choice',
    title: '会員からの声：月謝について',
    description: '「最近月謝が上がって、継続するか迷っています」という声が届きました。',
    choices: [
      {
        label: '特別割引を提供する',
        description: '2ヶ月分の割引で引き留める（一時的なコスト）',
        effect: { cash: -5000, members: -0, satisfaction: 10 },
      },
      {
        label: '現状維持（説明を送る）',
        description: '料金の妥当性を丁寧に説明する',
        effect: { satisfaction: 2, message: 'メッセージを送りました' },
      },
      {
        label: '月謝を下げる',
        description: '競争力を戻すが収益が減る',
        effect: { cash: -3000, members: 1, satisfaction: 5 },
      },
    ],
  },
  {
    id: 'venue_unavailable',
    type: 'choice',
    title: '会場が一時利用不可に',
    description: '施設の都合で来週1週間、会場が使えなくなりました。',
    choices: [
      {
        label: '代替会場を探す（費用+15,000円）',
        description: '臨時の会場を借りてレッスンを継続する',
        effect: { cash: -15000, satisfaction: 5, message: '会員への信頼を保てました' },
      },
      {
        label: '休講にする',
        description: '休講連絡を出す。満足度が下がるリスクあり',
        effect: { satisfaction: -15, members: -1 },
      },
    ],
  },
  {
    id: 'partnership_offer',
    type: 'choice',
    title: '地元スポーツショップからの提案',
    description: '近くのスポーツ用品店から「チラシをレジで配らせてほしい」と連絡が来ました。',
    choices: [
      {
        label: 'お願いする（無料）',
        description: '相互宣伝で集客に貢献できる',
        effect: { reputation: 5, members: 1 },
      },
      {
        label: '断る',
        description: '特に変化なし',
        effect: {},
      },
    ],
  },
];
