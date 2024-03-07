import {
  MessagesSquareIcon,
  LayoutDashboardIcon,
  BellIcon,
  UserCogIcon,
  ShoppingCartIcon,
  LandmarkIcon,
  QrCodeIcon,
  Dice3Icon,
} from "lucide-react";
import { type ReactNode } from "react";
export const NavbarRoutes: {
  title: string;
  href: string;
  description?: string;
  Icon?: ReactNode;
}[] = [
  {
    title: "Anasayfa",
    href: "/dashboard",
    description: "Bütün kullanıcı işlemlerinin bulunduğu dashboard",
    Icon: <LayoutDashboardIcon />,
  },
  {
    title: "Forum",
    href: "/forum",
    description: "Abdulleziz kullanıcılarının kullanacabileceği forum.",
    Icon: <MessagesSquareIcon />,
  },
  {
    title: "Hatırlatıcı",
    href: "/cron",
    description:
      "Hatırlatıcı oluştur veya hali hazırda olan hatırcılara katıl.",
    Icon: <BellIcon />,
  },
  {
    title: "Kullanıcı Yönet",
    href: "/manage",
    description: "Kullanıcıları gör, oylamalara katıl ve kullanıcıları yönet.",
    Icon: <UserCogIcon />,
  },
  {
    title: "Mağaza",
    href: "/store",
    description: "Kazandığın parayı harca.",
    Icon: <ShoppingCartIcon />,
  },
  {
    title: "Banka",
    href: "/bank",
    description: "Banka işlemlerini gör.",
    Icon: <LandmarkIcon />,
  },
  {
    title: "Yoklama",
    href: "/attendance",
    description: "Yoklama işlemleri",
    Icon: <QrCodeIcon />,
  },
  {
    title: "Kumar",
    href: "/gamble",
    description: "Abdülleziz Kumarhane",
    Icon: <Dice3Icon />,
  },
];
