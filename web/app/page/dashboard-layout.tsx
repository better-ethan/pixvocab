import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  BookAIcon,
  CheckIcon,
  Loader2,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  User2Icon,
  XIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router";
import type { Route } from "./+types/dashboard-layout";
import { createTrpcClient } from "@/util";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MainLogo, UserAvatar } from "@/components/partial";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const currentUser = await trpc.user.getCurrentUser.query();

  if (!currentUser) {
    throw redirect("/signin");
  }

  return { currentUser };
};

const menuSections: MenuSection[] = [
  {
    title: "Picture Vocab",
    icon: BookAIcon,
    items: [
      { label: "Create", path: "/dashboard/picture-vocab/create" },
      { label: "Authored", path: "/dashboard/picture-vocab/authored" },
    ],
  },
];

export default function AdminLayout() {
  const { currentUser } = useLoaderData<typeof loader>();

  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex mx-auto max-w-screen-2xl h-dvh flex-col md:flex-row overflow-hidden">
      <Drawer open={open} onOpenChange={setOpen} direction="left">
        <Drawer.Trigger asChild className="md:hidden self-start">
          <Button type="button" variant={"link"} size={"icon"}>
            <MenuIcon className="size-6" />
          </Button>
        </Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header className="flex flex-row items-center justify-between">
            <Link to="/" onClick={() => setOpen(false)}>
              <MainLogo className="h-8" />
            </Link>
            <Drawer.Close asChild>
              <Button type="button" variant={"link"} size={"icon"}>
                <XIcon />
              </Button>
            </Drawer.Close>
          </Drawer.Header>
          <div className="flex-1">
            <MenuContent
              sections={menuSections}
              username={currentUser?.name?.trim() || currentUser?.email}
              onItemClick={() => setOpen(false)}
            />
          </div>
        </Drawer.Content>
      </Drawer>
      <aside
        className={cn(
          "hidden md:block bg-white transition-all duration-300 ease-in-out overflow-hidden",
          "border-r-2",
          sidebarCollapsed ? "w-10" : "w-64"
        )}
      >
        {sidebarCollapsed ? (
          <Button
            variant={"link"}
            size={"icon"}
            onClick={() => setSidebarCollapsed(false)}
          >
            <MenuIcon className="size-6" />
          </Button>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between py-4">
              <Link to="/" className="flex items-center">
                <MainLogo className="h-8" />
              </Link>
              <Button
                variant={"link"}
                size={"icon"}
                onClick={() => setSidebarCollapsed(true)}
                className="hover:bg-primary/20"
              >
                <XIcon className="size-6" />
              </Button>
            </div>

            <div className="flex-1">
              <MenuContent
                variant="desktop"
                sections={menuSections}
                username={currentUser?.name?.trim() || currentUser?.email}
                avatar={currentUser?.image ?? undefined}
                onItemClick={() => setSidebarCollapsed(false)}
              />
            </div>
          </div>
        )}
      </aside>
      <main className="flex justify-center w-full py-2 px-1.5 lg:p-3 overflow-hidden h-full">
        <Outlet />
      </main>
    </div>
  );
}

interface MenuSection {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: {
    label: string;
    path: string;
  }[];
}
function MenuContent({
  sections,
  onItemClick,
  username,
  avatar,
  variant = "mobile",
}: {
  sections: MenuSection[];
  onItemClick: () => void;
  username: string;
  avatar?: string;
  variant?: "mobile" | "desktop";
}) {
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const isActive = (currentPath: string, itemPath: string) =>
    currentPath === itemPath;

  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    setIsSigningOut(false);
    navigate("/signin");
  };

  return (
    <nav className="flex flex-col justify-between h-full p-2">
      <div>
        {sections.map((section, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium uppercase"
              )}
            >
              <section.icon className="size-5" />
              <span>{section.title}</span>
            </div>
            {section.items.map((item, index) => {
              return (
                <Button
                  render={<Link to={item.path}>{item.label}</Link>}
                  nativeButton={false}
                  key={index}
                  onClick={onItemClick}
                  variant="link"
                  className={cn(
                    "w-full justify-start text-sm font-medium",
                    "hover:bg-primary/20 hover:no-underline",
                    isActive(currentPath, item.path) &&
                      "bg-primary shadow-xs border-2"
                  )}
                ></Button>
              );
            })}
          </div>
        ))}
      </div>
      <div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-medium uppercase">
            <SettingsIcon className="size-5" />
            <span>Settings</span>
          </div>
          <Button
            render={<Link to="/dashboard/user/current-plan">My Plan</Link>}
            nativeButton={false}
            variant={"link"}
            className={cn(
              "w-full justify-start text-sm font-medium",
              "hover:bg-primary/20 hover:no-underline",
              isActive(currentPath, "/dashboard/user/current-plan") &&
                "bg-primary shadow-xs border-2"
            )}
          ></Button>
          <Button
            render={<Link to="/dashboard/user/profile">My Profile</Link>}
            nativeButton={false}
            variant={"link"}
            className={cn(
              "w-full justify-start text-sm font-medium",
              "hover:bg-primary/20 hover:no-underline",
              isActive(currentPath, "/dashboard/user/profile") &&
                "bg-primary shadow-xs border-2"
            )}
          ></Button>
          <Button
            render={
              <Link to="/dashboard/user/change-password">Change Password</Link>
            }
            nativeButton={false}
            variant={"link"}
            className={cn(
              "w-full justify-start text-sm font-medium",
              "hover:bg-primary/20 hover:no-underline",
              isActive(currentPath, "/dashboard/user/change-password") &&
                "bg-primary shadow-xs border-2"
            )}
          ></Button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar src={avatar} className="size-8" />
            <span className="truncate">{username}</span>
          </div>
          {variant === "mobile" ? (
            <Drawer direction="bottom">
              <Drawer.Trigger asChild>
                <Button variant="link" size="icon">
                  <LogOutIcon />
                </Button>
              </Drawer.Trigger>
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>Are you sure you want to log out?</Drawer.Title>
                </Drawer.Header>
                <Drawer.Footer>
                  <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="shadow-sm"
                  >
                    Confirm
                  </Button>
                  <Drawer.Close asChild>
                    <Button variant="outline" className="shadow-sm">
                      Cancel
                    </Button>
                  </Drawer.Close>
                </Drawer.Footer>
              </Drawer.Content>
            </Drawer>
          ) : (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <AlertDialogTrigger
                      render={
                        <Button variant={"link"} size={"icon"}>
                          <LogOutIcon />
                        </Button>
                      }
                    />
                  }
                />
                <TooltipContent className="shadow-none">Log Out</TooltipContent>
              </Tooltip>
              <AlertDialogContent className="shadow-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to log out?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You will log out from the current account and return to the
                    sign-in page. Do you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="shadow-sm">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="shadow-sm"
                  >
                    Confirm{" "}
                    {isSigningOut && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </nav>
  );
}
