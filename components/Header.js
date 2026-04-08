"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  KeyBoldDuotone,
  LetterBoldDuotone,
  Login3BoldDuotone,
  UserIdBoldDuotone,
  UserIdLineDuotone,
} from "solar-icons";
import { DropdownIcon } from "./Icons";
import PasswordModal from "./modals/Password";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

const Header = () => {
  const { data: session } = useSession();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const roleLabel =
    session?.user?.role === 10
      ? "Супер админ"
      : session?.user?.role === 40
        ? "Админ"
        : "Тестийн админ";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -translate-y-1/2 rotate-[-30deg] whitespace-nowrap text-lg font-semibold tracking-widest text-gray-400 opacity-50">
            {Array.from({ length: 200 }).map((_, i) => (
              <div key={i} className="mb-12">
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
                ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ&nbsp;&nbsp;&nbsp;ТЕСТ
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto flex items-center justify-between px-9 py-3">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/hire-2.png" width={80} height={24} alt="Hire Logo" />
              <p className="bg-main px-1.5 text-xl font-black text-white">
                ТЕСТ
              </p>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto rounded-full px-2 py-1.5 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-main/30">
                      <span className="text-main text-lg font-extrabold">
                        {session?.user?.name?.[0]}
                      </span>
                    </div>

                    <div className="hidden sm:block">
                      <div className="font-bold text-gray-800">
                        {session?.user?.name}
                      </div>
                    </div>

                    <DropdownIcon width={15} height={15} color="#94a3b8" />
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex gap-1.5">
                    <div className="mt-0.5">
                      <UserIdBoldDuotone width={16} height={16} />
                    </div>
                    <div>
                      <span className="font-semibold text-black">
                        {session?.user?.email}
                      </span>
                      <div className="inline-flex text-sm font-semibold text-blue-700">
                        {roleLabel}
                      </div>
                      {/* <div className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-700">
                        {roleLabel}
                      </div> */}
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setIsPasswordModalVisible(true)}
                  className="cursor-pointer"
                >
                  <KeyBoldDuotone width={18} height={18} />
                  Нууц үг солих
                </DropdownMenuItem>

                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    signOut({ callbackUrl: "/auth/signin" });
                  }}
                >
                  <Login3BoldDuotone width={18} height={18} />
                  Гарах
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <PasswordModal
        isOpen={isPasswordModalVisible}
        onClose={() => {
          setIsPasswordModalVisible(false);
        }}
      />
    </>
  );
};

export default Header;
