import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useTransition as useNavigation,
} from "@remix-run/react";
import { json, type LoaderArgs, type ActionArgs } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { getUserById, updateUserTokens } from "~/models/user.server";
import {
  createCompletion,
  getCompletionListItems,
} from "~/models/completion.server";
import CompletionList from "~/components/CompletionList";

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

  const newTokens = currentUser!.tokens - +tokens;
  const updatedUser = await updateUserTokens(userId, newTokens);

  return json({ addedCompletion, updatedUser, errors: null }, { status: 200 });
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  const currentUser = await getUserById(userId);

  if (!currentUser)
    throw json({ completions: null, user: null }, { status: 404 });
  const completions = await getCompletionListItems({ userId });

  if (!completions || completions.length === 0) {
    throw json(
      { message: "No has hecho preguntas" },
      {
        status: 404,
        statusText: "No encontrado",
      }
    );
  }

  return json({ completions, user: currentUser }, { status: 200 });
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const { completions, user } = useLoaderData<typeof loader>();

  const navigation = useNavigation();
  const isSubmiting = navigation.state === "submitting";

  const buttonClasses = `rounded py-2 px-4 ${
    isSubmiting
      ? "bg-slate-300 text-gray-400 inline-flex items-center text-center"
      : "bg-slate-600 hover:bg-slate-700 focus:bg-slate-800 text-white"
  }`;

  return (
    <main className="flex flex-col bg-white sm:flex sm:items-center sm:justify-center">
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
          <div className="flex w-full flex-col items-center justify-center py-8">
            <Form method="post" className="w-[40rem]">
              <fieldset disabled={isSubmiting}>
                <label
                  htmlFor="prompt"
                  className="block text-sm font-medium text-gray-700"
                >
                  Pregúntame algo...
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
                    className="w-24 rounded-sm border border-gray-500 p-4"
                  />
                  {actionData?.errors?.tokens && (
                    <div className="text-sm text-red-700" id="tokens-error">
                      {actionData.errors.tokens}
                    </div>
                  )}
                  <div className="flex w-full items-center justify-end gap-2">
                    <div>
                      {isSubmiting
                        ? "calculando"
                        : `Te quedan ${user.tokens.toLocaleString(
                            "es-CL"
                          )} tokens`}
                    </div>
                    <button className={buttonClasses}>
                      {isSubmiting ? (
                        <>
                          <svg
                            role="status"
                            className="mr-2 inline h-4 w-4 animate-spin text-gray-200 dark:text-gray-600"
                            viewBox="0 0 100 101"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                              fill="currentColor"
                            />
                            <path
                              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                              fill="#1C64F2"
                            />
                          </svg>
                          Preguntando...
                        </>
                      ) : (
                        "Preguntar"
                      )}
                    </button>
                  </div>
                </div>
              </fieldset>
            </Form>
            {!actionData?.errors && actionData?.addedCompletion ? (
              <div className="w-full px-20 py-4 text-center">
                {actionData.addedCompletion.answer}
              </div>
            ) : (
              isSubmiting && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  fill="currentColor"
                  className="bi bi-arrow-repeat animate-spin"
                  viewBox="0 0 16 16"
                >
                  <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
                  <path
                    fill-rule="evenodd"
                    d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"
                  />
                </svg>
              )
            )}

            {completions && (
              <div className="py-12">
                <CompletionList prompts={completions} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
