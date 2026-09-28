import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to student dashboard
  redirect("/student");
}