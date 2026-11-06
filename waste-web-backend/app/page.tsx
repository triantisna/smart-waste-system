import { redirect } from "next/navigation";

export default function Home() {
  // Langsung arahkan pengunjung ke halaman login admin
  redirect("/login");
}
