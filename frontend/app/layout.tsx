import "./globals.css";
export const metadata = { title: "Delivery Hub", description: "Client delivery and meeting workspace" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
