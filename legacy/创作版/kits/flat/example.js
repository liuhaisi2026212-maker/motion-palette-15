// 示例镜头表：主题「为什么大多数人用不好 AI」
export const EXAMPLE = {
  kit: 'flat', palette: 'mint',
  shots: [
    { type: 'title', seconds: 3, text: '为什么你总是【用不好】AI？', sub: '不是 AI 不行，是你没说清楚' },
    { type: 'compare', seconds: 3.5, text: '同一个问题，两种问法', left: { icon: 'cross', text: '帮我写个文案', sub: '太笼统，AI 只能瞎猜' }, right: { icon: 'check', text: '给谁看、要什么效果', sub: '说清楚，它才答得准' } },
    { type: 'statement', seconds: 3, text: 'AI 不会读心，它只会【照你说的】做', icon: 'robot' },
    { type: 'list', seconds: 4, text: '下次提问，补齐这三样', items: [{ icon: 'person', text: '给谁看' }, { icon: 'target', text: '要什么效果' }, { icon: 'book', text: '举个例子' }] },
    { type: 'number', seconds: 3, value: 3, unit: '倍', text: '回答的可用度，能差出【好几倍】' },
    { type: 'quote', seconds: 3.5, text: '把 AI 当成一个【新来的同事】，交代清楚再让它干活', by: '柳爷' },
    { type: 'outro', seconds: 3.5, text: '关注我', sub: '每天一个 AI 实用技巧', button: '+ 关注' },
  ],
};
