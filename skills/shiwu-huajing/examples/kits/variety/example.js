// 示例镜头表：主题「为什么大多数人用不好 AI」（没有放照片时用彩色花纹底；在工作台里上传照片后，镜头里写 "image": "@1" 就会用第 1 张）
export const EXAMPLE = {
  kit: 'variety', show: '柳爷不迷糊', ep: 'EP.01',
  shots: [
    { type: 'title', seconds: 2.5, text: '你真的会用AI吗', sub: '90% 的人都问错了' },
    { type: 'caption', seconds: 2.2, text: '很多人一上来就说：帮我写个文案', sub: '然后……' },
    { type: 'vertical', seconds: 2.5, text: '空气突然安静', sub: 'AI 也很懵' },
    { type: 'boom', seconds: 2.2, text: '答非所问！', sub: '不是 AI 笨，是你没说清' },
    { type: 'whisper', seconds: 2.2, paren: '（小声）', text: '我以前也这么干' },
    { type: 'warn', seconds: 2.4, text: '干货预警' },
    { type: 'tag', seconds: 2.5, label: '正确姿势', text: '说清三件事', sub: '给谁看 · 要啥效果 · 举个例子' },
    { type: 'meter', seconds: 2.6, text: '回答质量', low: '一般', high: '爆表', boom: '直接起飞' },
    { type: 'stamp', seconds: 1.8, text: '柳爷认证', sub: '亲测有效' },
    { type: 'bye', seconds: 2.4, text: '学会了吗～', sub: '点个关注不迷路' },
  ],
};
