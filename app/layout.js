import { Provider } from "@/utils/provider";
import localFont from "next/font/local";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
const GIP = localFont({
  src: [
    {
      path: "./fonts/Gilroy-Thin.ttf",
      weight: "300",
    },
    {
      path: "./fonts/Gilroy-Regular.ttf",
      weight: "400",
    },
    {
      path: "./fonts/Gilroy-Medium.ttf",
      weight: "500",
    },
    {
      path: "./fonts/Gilroy-SemiBold.ttf",
      weight: "600",
    },
    {
      path: "./fonts/Gilroy-Bold.ttf",
      weight: "700",
    },
    {
      path: "./fonts/Gilroy-ExtraBold.ttf",
      weight: "800",
    },
    {
      path: "./fonts/Gilroy-Black.ttf",
      weight: "900",
    },
    {
      path: "./fonts/Gilroy-Heavy.ttf",
      weight: "1000",
    },
  ],
  variable: "--font-gip",
});

export const metadata = {
  title: "Hire / Админ",
  description: "Powered by Axiom Inc.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Provider>
        <body className={`${GIP.variable} antialiased overscroll-y-none`}>
          <AntdRegistry>{children}</AntdRegistry>
          <Toaster position="top-center" />
        </body>
      </Provider>
    </html>
  );
}
