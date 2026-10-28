// 示例镜头表：主题「为什么大多数人用不好 AI」
export const EXAMPLE = {
  kit: 'pixel', stage: 'AI',
  shots: [
    { type: 'title', seconds: 3.5, text: 'AI 闯关记', sub: '为什么你总用不好 AI' },
    { type: 'run', seconds: 3, text: '第一关：随口一问', sub: '「帮我写个文案」' },
    { type: 'boss', seconds: 4, name: '怪物：答非所问', text: '说不清楚，AI 就乱猜', sub: '' },
    { type: 'dialog', seconds: 4, speaker: '老法师', text: '你要给谁看？要什么效果？有没有参考？' },
    { type: 'items', seconds: 4, items: ['给背景', '定目标', '举例子'], text: '补齐三件装备' },
    { type: 'levelup', seconds: 3.5, text: 'LEVEL UP!', stats: [['准确度', 92], ['省时间', 80], ['满意度', 95]] },
    { type: 'chest', seconds: 3.5, text: '把 AI 当新同事', sub: '交代清楚，再让它干活' },
    { type: 'ending', seconds: 3, text: '关注我', sub: '下一关继续' },
  ],
};
