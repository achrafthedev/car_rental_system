import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Autodrive — Car Rental",
  description: "Local-first, dockerized car rental management system.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
