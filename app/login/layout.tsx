import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — InvenPro",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
      }}
    >
      {children}
    </div>
  );
}
