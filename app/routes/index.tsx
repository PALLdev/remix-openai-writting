import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();
  return (
    <main className="relative min-h-screen bg-white sm:flex sm:items-center sm:justify-center">
      <h1>Bienvenido {user?.email || "anonimo"}</h1>
    </main>
  );
}