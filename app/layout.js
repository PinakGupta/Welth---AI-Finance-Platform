import { Inter } from "next/font/google";
import Header from "@/components/header";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({subsets:["latin"]});

export const metadata = {
  title: "Welth",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          {/* Header */}
          <Header/>
          <main className="min-h-screen">{children}</main>
          <Toaster richColors/> 
          {/* Footer */}
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto text-center px-4 text-gray-600">
              <p> Created By Pinak Gupta </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
