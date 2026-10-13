import { createRootRoute, HeadContent, Link, Outlet, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
});

function RootLayout() {
  return (
    <>
      {/* Applies each route's `head` (title, description) to the document. */}
      <HeadContent />
      <SiteHeader />
      <main>
        <Outlet />
      </main>
    </>
  );
}

function CenteredMessage({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <CenteredMessage title="Page not found" body="That page doesn't exist. Let's get you back to the code.">
      <Link to="/" className="btn-primary">
        Go home
      </Link>
    </CenteredMessage>
  );
}

function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  console.error(error);
  return (
    <CenteredMessage title="Something broke" body="This page hit an error. Try again, or head back home.">
      <button
        className="btn-primary"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        Try again
      </button>
      <Link to="/" className="btn-ghost">
        Go home
      </Link>
    </CenteredMessage>
  );
}
