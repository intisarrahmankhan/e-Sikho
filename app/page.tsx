import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to student dashboard for Sprint 1
  redirect("/student");
}
