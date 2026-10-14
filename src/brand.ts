export const BRAND_COLOR = 0x1cd3aa;
export const ALERT_COLOR = 0xf04747;
export const LOG_COLOR = 0x5865f2;

// 圖示用機器人自己的頭像（登入後由 ready 事件設定），不依賴外部 CDN；設定前只顯示文字
const footer: { text: string; iconURL?: string } = { text: "無限遊玩服務" };

export const FOOTER: Readonly<typeof footer> = footer;

export function setFooterIcon(url: string): void {
  footer.iconURL = url;
}
