import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Text } from "@/components/ui/text";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  BookAIcon,
  ChevronDownIcon,
  Loader2,
  LogOutIcon,
  MenuIcon,
  User2Icon,
  UserIcon,
} from "lucide-react";
import {
  isRouteErrorResponse,
  Link,
  Outlet,
  useLoaderData,
} from "react-router";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuPositioner,
} from "@/components/ui/navigation-menu";
import { createTrpcClient } from "@/util";
import type { Route } from "./+types/public-layout";
import { useState } from "react";
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
import { MainLogo } from "@/components/partial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const trpc = createTrpcClient(request);

  const category = await trpc.category.list.query();

  return {
    category,
  };
};

const baseDrawerLinkClasses =
  "font-bold text-black decoration-2 underline-offset-4 transition-colors hover:text-[#3B82F6] hover:underline";

export default function PublicLayout() {
  const { category } = useLoaderData<typeof loader>();
  const { data: session } = authClient.useSession();

  const [navigationMenuOpened, setNavigationMenuOpened] = useState<true | null>(
    null
  );

  const [drawerOpened, setDrawerOpened] = useState(false);
  const [vocabsOpened, setvocabsOpened] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLogoutAlertDialogOpening, setIsAlertDialogOpening] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    setIsSigningOut(false);
    setDrawerOpened(false);
    setIsAlertDialogOpening(false);
  };

  return (
    <div className={cn("flex flex-col h-screen overflow-x-hidden")}>
      <nav className="relative sticky top-0 z-50 border-b-2 border-black bg-white px-4 py-2 md:px-8">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between">
          <Link className="flex cursor-pointer items-center gap-2" to="/">
            <MainLogo />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <NavigationMenu
              value={navigationMenuOpened}
              onValueChange={setNavigationMenuOpened}
              align="center"
              sideOffset={16}
            >
              <NavigationMenuList className={"flex gap-1"}>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={
                      <Link
                        to="/how-it-works"
                        className={cn("font-bold text-black")}
                      />
                    }
                  >
                    How it works
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn("font-bold text-black [&_svg]:size-4")}
                  >
                    Vocab
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-150 grid-cols-[1fr_1.5fr] gap-0">
                      <div className="flex flex-col justify-between rounded-l-md bg-gradient-to-b from-primary to-primary p-5 text-white">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-widest opacity-90">
                            Get Started
                          </p>
                          <h3 className="mt-2 text-lg font-bold leading-tight">
                            Find your perfect vocab
                          </h3>
                          <p className="mt-2 text-sm opacity-90">
                            Browse all categories and skill levels.
                          </p>
                        </div>
                        <NavigationMenuLink
                          render={
                            <Link
                              to="/category/all"
                              onClick={() => setNavigationMenuOpened(null)}
                            />
                          }
                          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4 hover:opacity-80"
                        >
                          View all vocab →
                        </NavigationMenuLink>
                      </div>

                      <ul className="grid grid-cols-2 gap-1 p-3">
                        {category.map((cat) => (
                          <li key={cat.slug}>
                            <NavigationMenuLink
                              render={<Link to={`/category/${cat.slug}`} />}
                              className="flex flex-col gap-0.5 rounded-md p-3 items-start transition-colors hover:bg-accent"
                              onClick={() => setNavigationMenuOpened(null)}
                            >
                              <span className="font-medium text-sm">
                                {cat.name}
                              </span>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={
                      <Link
                        to="/pricing"
                        className={cn("font-bold text-black")}
                      />
                    }
                  >
                    Pricing
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={
                      <Link to="/blog" className={cn("font-bold text-black")} />
                    }
                  >
                    Blog
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <div className="ml-2 flex items-center gap-3">
              {session ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button size="icon" className="shadow-sm" />}
                    >
                      <User2Icon className="size-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="shadow-sm min-w-42">
                      <DropdownMenuItem
                        render={
                          <Link
                            to="/dashboard/user/profile"
                            className="capitalize"
                          ></Link>
                        }
                      >
                        <UserIcon /> My Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        render={
                          <Link
                            to="/dashboard/picture-vocab/authored"
                            className="capitalize"
                          ></Link>
                        }
                      >
                        <BookAIcon /> My Authored
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsAlertDialogOpening(true)}
                      >
                        <LogOutIcon /> Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialog
                    open={isLogoutAlertDialogOpening}
                    onOpenChange={setIsAlertDialogOpening}
                  >
                    <AlertDialogTrigger></AlertDialogTrigger>
                    <AlertDialogContent className="shadow-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you sure you want to log out?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          You will log out from the current account and return
                          to the sign-in page. Do you want to continue?
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
                </>
              ) : (
                <Button
                  render={
                    <Link to="/signin" className="uppercase">
                      Log in
                    </Link>
                  }
                  nativeButton={false}
                  variant="default"
                  size="sm"
                  className="shadow-sm"
                ></Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <Drawer
              direction="right"
              open={drawerOpened}
              onOpenChange={setDrawerOpened}
            >
              <Drawer.Trigger asChild>
                <Button size="icon" className="shadow-sm">
                  <MenuIcon className="size-4" />
                </Button>
              </Drawer.Trigger>
              <Drawer.Content className="flex flex-col py-4">
                <div className="flex flex-col h-dvh gap-8 p-4 overflow-y-auto">
                  <Link
                    to="/how-it-works"
                    className={cn(baseDrawerLinkClasses)}
                    onClick={() => setDrawerOpened(false)}
                  >
                    How it works
                  </Link>
                  <div className="flex flex-col gap-2">
                    <button
                      className={cn(
                        baseDrawerLinkClasses,
                        "flex items-center justify-between w-full text-left",
                        "hover:no-underline"
                      )}
                      onClick={() => setvocabsOpened((v) => !v)}
                    >
                      Vocab
                      <ChevronDownIcon
                        className={cn(
                          "size-4 transition-transform duration-200",
                          vocabsOpened && "rotate-180"
                        )}
                      />
                    </button>
                    {vocabsOpened && (
                      <div className="flex flex-col gap-2 pl-2 text-gray-800">
                        {category.map((cat) => (
                          <Link
                            key={cat.slug}
                            to={`/category/${cat.slug}`}
                            className="text-base py-2"
                            onClick={() => setDrawerOpened(false)}
                          >
                            {cat.name}
                          </Link>
                        ))}
                        <Link
                          to="/category/all"
                          className="text-base py-2 underline"
                          onClick={() => setDrawerOpened(false)}
                        >
                          View All →
                        </Link>
                      </div>
                    )}
                  </div>
                  <Link
                    to="/pricing"
                    className={cn(baseDrawerLinkClasses)}
                    onClick={() => setDrawerOpened(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/blog"
                    className={cn(baseDrawerLinkClasses)}
                    onClick={() => setDrawerOpened(false)}
                  >
                    Blog
                  </Link>
                  {session ? (
                    <>
                      <Link
                        to="/dashboard/user/profile"
                        className={cn(baseDrawerLinkClasses)}
                        onClick={() => setDrawerOpened(false)}
                      >
                        Profile
                      </Link>

                      <Drawer direction="bottom">
                        <Drawer.Trigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shadow-sm"
                          >
                            Log out <LogOutIcon />
                          </Button>
                        </Drawer.Trigger>
                        <Drawer.Content>
                          <Drawer.Header>
                            <Drawer.Title>
                              Are you sure you want to log out?
                            </Drawer.Title>
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
                    </>
                  ) : (
                    <Link
                      to="/signin"
                      className={cn(baseDrawerLinkClasses)}
                      onClick={() => setDrawerOpened(false)}
                    >
                      Log in
                    </Link>
                  )}
                </div>
              </Drawer.Content>
            </Drawer>
          </div>
        </div>
      </nav>
      <main className="flex-1 px-4 pt-4 pb-8 max-w-screen-2xl mx-auto w-full">
        <Outlet />
      </main>
      <footer
        className={cn(
          "flex flex-col items-center md:flex-row md:justify-between gap-8",
          "my-8 max-w-5xl mx-auto w-full px-4"
        )}
      >
        <div>
          <Link to="/" className="flex cursor-pointer items-center gap-2">
            <MainLogo />
          </Link>
        </div>
        <div className="flex flex-col items-center md:flex-row md:w-fit gap-6">
          <Link
            to="/about"
            className="px-4 py-1 hover:underline hover:text-blue-600 transition-colors duration-200"
          >
            About
          </Link>
          <Link
            to="/terms-of-use"
            className="px-4 py-1 hover:underline hover:text-blue-600 transition-colors duration-200"
          >
            Terms of Use
          </Link>
          <Link
            to="/privacy-policy"
            className="px-4 py-1 hover:underline hover:text-blue-600 transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <Link
            to="/contact-us"
            className="px-4 py-1 hover:underline hover:text-blue-600 transition-colors duration-200"
          >
            Contact Us
          </Link>
        </div>
      </footer>
    </div>
  );
}
