import { Form, Link } from "@remix-run/react";
import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();
  return (
    <main className="bg-white sm:flex sm:items-center sm:justify-center">
      <div className="flex h-full min-h-screen flex-col">
        <header className="flex w-screen items-center justify-between bg-slate-300 p-4">
          {user ? (
            <>
              <h1 className="text-lg font-semibold">Bienvenido {user.email}</h1>
              <Form method="post" action="/logout">
                <button
                  type="submit"
                  className="rounded bg-slate-600 px-4 py-2 text-lg text-white hover:bg-red-500 hover:opacity-80 active:bg-red-600"
                >
                  Cerrar sesión
                </button>
              </Form>
            </>
          ) : (
            <nav className="flex w-full items-center justify-end gap-8">
              <Link
                className="rounded bg-slate-600 px-4 py-2 text-lg text-white hover:opacity-90 active:bg-red-600"
                to="/registro"
              >
                Registro
              </Link>
              <Link
                className="rounded bg-slate-600 px-4 py-2 text-lg text-white hover:opacity-90 active:bg-red-600"
                to="/login"
              >
                Ingreso
              </Link>
            </nav>
          )}
        </header>
        <div className="grid place-items-center bg-slate-200 ">
          <h1 className="text-lg font-semibold">
            Bienvenido a esta asombrosa app!
          </h1>
        </div>
      </div>
    </main>
  );
}
