import Header from "@/components/Header";

export default function MainAppLayout({ children }) {
  return (
    <>
      <Header />
      <div className="pt-[66px]">{children}</div>
    </>
  );
}
