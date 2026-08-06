"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { DropdownIcon, MenuIcon } from "./Icons";
import { Divider } from "antd";
import {
  ClipboardTextBoldDuotone,
  DatabaseBoldDuotone,
  FolderFavouriteBookmarkBoldDuotone,
  HandShakeBoldDuotone,
  LetterBoldDuotone,
  LightbulbBoltBoldDuotone,
  MoneyBagBoldDuotone,
  NotesBoldDuotone,
  PenNewRoundBoldDuotone,
  PeopleNearbyBoldDuotone,
} from "solar-icons";

const Menu = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openMenu, setOpenMenu] = useState(null);

  const menuItems = [
    {
      name: "Тестийн сан",
      key: "tests",
      href: "/",
      icon: <NotesBoldDuotone width={18} />,
    },
    {
      name: "Хэрэглэгчид",
      key: "users",
      subMenu: [
        { name: "Байгууллагууд", href: "/orgs" },
        { name: "Хэрэглэгчид", href: "/users" },
        { name: "Админ эрхтэй", href: "/admins" },
      ],
      icon: <PeopleNearbyBoldDuotone width={18} />,
    },
    {
      name: "Үр дүн",
      key: "results",
      href: "/results",
      icon: <FolderFavouriteBookmarkBoldDuotone width={18} />,
    },
    {
      name: "Санал, хүсэлт",
      key: "feedbacks",
      subMenu: [
        { name: "Тестийн тухай", href: "/feedbacks" },
        { name: "Тестийн явцад тулгарсан", href: "/feedbacks/test" },
      ],
      icon: <LightbulbBoltBoldDuotone width={18} />,
    },
    {
      name: "Төлбөр",
      key: "payments",
      href: "/payments",
      icon: <MoneyBagBoldDuotone width={18} />,
    },
    {
      name: "Блог",
      key: "blogs",
      href: "/blogs",
      icon: <PenNewRoundBoldDuotone width={18} />,
    },
    {
      name: "И-мэйл жагсаалт",
      key: "email",
      href: "/email",
      icon: <LetterBoldDuotone width={18} />,
    },
    {
      name: "Холбогдох",
      key: "contact",
      subMenu: [
        { name: "Тест нийлүүлэх", href: "/contact" },
        { name: "Хамтран ажиллах", href: "/contact/collab" },
        { name: "Тестийн талаарх санал хүсэлт", href: "/contact/test" },
        { name: "Бусад", href: "/contact/other" },
      ],
      icon: <HandShakeBoldDuotone width={18} />,
    },
    // Зөвхөн супер админд (role=10) харагдана
    ...(session?.user?.role === 10
      ? [
          {
            name: "Ачаалал",
            key: "health",
            href: "/health",
            icon: <DatabaseBoldDuotone width={18} />,
          },
          {
            name: "Алдааны лог",
            key: "error-logs",
            href: "/error-logs",
            icon: <ClipboardTextBoldDuotone width={18} />,
          },
        ]
      : []),
  ];

  const isActive = (href) => pathname === href;

  return (
    <div className="border-r border-neutral py-3 w-[220px] h-screen">
      <div className="px-9 font-extrabold text-menu flex items-center gap-2 text-[#6a6d70]">
        <MenuIcon width={14} />
        Цэс
      </div>
      <Divider />
      <div className="flex-col flex gap-1 px-3">
        {menuItems.map((item) => {
          const hasSubMenu = item.subMenu && item.subMenu.length > 0;

          const isSubActive =
            hasSubMenu &&
            item.subMenu.some((sub) => pathname.startsWith(sub.href));

          const isOpen = openMenu === item.key || isSubActive;

          return (
            <div key={item.key}>
              {/* Main Menu */}
              <div
                onClick={() =>
                  hasSubMenu ? setOpenMenu(isOpen ? null : item.key) : null
                }
                className={`flex justify-between items-center cursor-pointer rounded-3xl px-2
          hover:bg-gray-100 transition-colors
          ${
            !hasSubMenu && isActive(item.href)
              ? "bg-main/10 text-main font-semibold"
              : ""
          }
          ${hasSubMenu && isOpen ? "bg-gray-100 font-semibold" : ""}`}
              >
                {hasSubMenu ? (
                  <div className="px-4 py-2 w-full flex items-center gap-2 text-[#444]">
                    {item.icon}
                    {item.name}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="px-4 py-2 w-full flex items-center gap-2"
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )}
                {hasSubMenu && (
                  <span
                    className={`pr-2 text-sm transition-transform duration-300`}
                  >
                    <DropdownIcon
                      width={12}
                      height={12}
                      rotate={isOpen ? 0 : -90}
                    />
                  </span>
                )}
              </div>

              {/* Submenu */}
              {hasSubMenu && isOpen && (
                <div className="flex flex-col gap-1 mt-1 ml-8 border-l-2 border-gray-300 pl-1.5">
                  {item.subMenu.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`px-3 py-1.5 rounded-3xl mr-0.75 transition-colors
                hover:bg-gray-100 hover:text-main
                ${
                  isActive(sub.href)
                    ? "bg-main/10 text-main font-semibold"
                    : "text-[#555]"
                }`}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Menu;
