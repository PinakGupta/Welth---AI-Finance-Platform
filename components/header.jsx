import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton
  } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { PenBox, LayoutDashboard } from "lucide-react";
import { Button } from './ui/button'
import { checkUser } from '@/lib/checkUser';

const header = async() => {
    await checkUser();
  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <nav className='container mx-auto flex justify-between items-center py-4 px-4'>
            <Link href = '/'>
                <Image
                className="h-12 w-auto object-contain"
                src = {"/logo.png"}
                alt = "welth logo"
                height={60}
                width={200}
                />
            </Link>
            {/* Navigation Links - Different for signed in/out users */}
            <div className="hidden md:flex items-center space-x-8">
            <SignedOut>
                <a href="#features" className="text-gray-600 hover:text-blue-600">
                Features
                </a>
                <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600"
                >
                Testimonials
                </a>
            </SignedOut>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center space-x-4'>
                <SignedIn>
                    <Link
                    href="/dashboard"
                    className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
                    >
                    <Button variant="outline">
                        <LayoutDashboard size={18} />
                        <span className="hidden md:inline">Dashboard</span>
                    </Button>
                    </Link>
                    <a href="/transaction/create">
                    <Button className="flex items-center gap-2">
                        <PenBox size={18} />
                        <span className="hidden md:inline">Add Transaction</span>
                    </Button>
                    </a>
                </SignedIn>
                <SignedOut>
                    <SignInButton forceRedirectUrl='/dashboard'>
                        <Button variant='outline'>
                            Login
                        </Button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton
                    appearance={{
                        elements: {
                          avatarBox: "w-10 h-10",
                        },
                      }}
                    />
                </SignedIn>
            </div>
        </nav>
    </header>
  )
}

export default header
