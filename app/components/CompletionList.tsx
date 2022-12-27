import { Link } from "@remix-run/react";

type CompletionListProps = {
  prompts: { prompt: string; id: string }[];
};

export default function CompletionList({ prompts }: CompletionListProps) {
  return (
    <ul className="flex h-full flex-wrap justify-center gap-4">
      {prompts.map((pro, index) => (
        <li
          key={pro.id}
          className="w-3/12 rounded bg-slate-600 p-6 shadow-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:bg-slate-500"
        >
          <Link to={"/"}>
            <article>
              <header>
                <ul className="mb-2 flex items-center justify-between border-b-2 border-b-gray-200 pb-2 font-bold text-gray-200">
                  <li># {index + 1}</li>
                </ul>
              </header>
              <p className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-gray-200">
                {pro.prompt}
              </p>
            </article>
          </Link>
        </li>
      ))}
    </ul>
  );
}
