import { Form, Link, useActionData } from "@remix-run/react";
import { json, redirect, type ActionArgs } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { useOptionalUser } from "~/utils";
import { getUserById, updateUserTokens } from "~/models/user.server";
import { createCompletion } from "~/models/completion.server";

const makeRequest = async ({
  prompt,
  tokens,
}: {
  prompt: string;
  tokens: number;
}) => {
  try {
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: tokens,
        temperature: 0,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error: any) {
    return json({ error: error.message });
  }
};

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const currentUser = await getUserById(userId);

  if (!currentUser) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const tokens = formData.get("tokens");

  if (typeof tokens !== "string" || tokens.length === 0) {
    return json(
      { errors: { tokens: "Campo obligatorio", prompt: null } },
      { status: 400 }
    );
  }

  if (currentUser && +tokens > currentUser.tokens) {
    return json(
      { errors: { tokens: "No tienes suficientes tokens", prompt: null } },
      { status: 400 }
    );
  }

  if (typeof prompt !== "string" || prompt.length === 0) {
    return json(
      { errors: { tokens: null, prompt: "Campo obligatorio" } },
      { status: 400 }
    );
  }

  if (prompt.length < 5) {
    return json(
      { errors: { tokens: null, prompt: "Mínimo 5 caracteres" } },
      { status: 400 }
    );
  }

  const data = await makeRequest({ prompt, tokens: +tokens });
  const completionText = data.choices[0].text;

  const addedCompletion = await createCompletion({
    userId,
    prompt,
    tokens: +tokens,
    answer: completionText,
  });

  // const regex = /\S/g; // split on non-whitespace characters

  // const promptLenght = prompt.split(regex).length - 1;
  // const newTokens = +tokens - promptLenght;
  const newTokens = currentUser.tokens - +tokens;
  const updatedUser = await updateUserTokens(userId, newTokens);

  return json({ addedCompletion, updatedUser, errors: null }, { status: 200 });
}

export default function Index() {
  const user = useOptionalUser();
  const actionData = useActionData<typeof action>();

  return (
    <main className="flex h-full flex-col bg-white sm:flex sm:items-center sm:justify-center">
      <header className="flex w-full items-center justify-between bg-slate-300 p-4">
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
      <div className="flex h-full w-full flex-col items-center bg-slate-200 ">
        <h1 className="py-4 text-3xl font-semibold">
          Bienvenido a esta asombrosa app!
        </h1>
        {user && (
          <div className="py-8">
            <Form method="post" className="w-[40rem]">
              <fieldset>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700"
                >
                  Escribe algo...
                </label>
                <div className="mt-1">
                  <textarea
                    id="prompt"
                    required
                    autoFocus={true}
                    name="prompt"
                    autoComplete="prompt"
                    rows={5}
                    className="w-full resize-none rounded border border-gray-500 px-2 py-1 text-lg"
                  />
                  {actionData?.errors?.prompt && (
                    <div
                      className="mb-2 pb-1 text-sm text-red-700"
                      id="prompt-error"
                    >
                      {actionData.errors.prompt}
                    </div>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-4">
                  <input
                    type="number"
                    name="tokens"
                    id="tokens"
                    defaultValue={150}
                    className="w-24 rounded-sm p-4"
                  />
                  {actionData?.errors?.tokens && (
                    <div className="text-sm text-red-700" id="tokens-error">
                      {actionData.errors.tokens}
                    </div>
                  )}
                  <div className="flex w-full items-center justify-end gap-2">
                    <div>
                      Te quedan {user.tokens.toLocaleString("es-CL")} tokens
                    </div>
                    <button className="rounded bg-slate-600  py-2 px-4 text-white hover:bg-slate-700 focus:bg-slate-800">
                      Preguntar
                    </button>
                  </div>
                </div>
              </fieldset>
            </Form>
          </div>
        )}

        {!actionData?.errors && actionData?.addedCompletion && (
          <div className="w-full px-20 py-4 text-center">
            {actionData.addedCompletion.answer}
          </div>
        )}
      </div>
    </main>
  );
}
