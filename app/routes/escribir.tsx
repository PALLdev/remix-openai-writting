import { useUser } from "~/utils";

export default function Index() {
  const user = useUser();
  return <div>{user.id}</div>;
}
