import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";

export default function MainAppLayout({ children }) {
  return (
    <>
      <Header />
      <div className="pt-[66px]">
        {children}
        <Toaster position="top-center" />
      </div>
    </>
  );
}
