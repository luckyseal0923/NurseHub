import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'護理人員資料中心｜NurseHub',description:'護理部自主維護的護理人員清冊、異動歷程與平台使用資格。示範資料平台。',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-Hant"><body>{children}</body></html>}
