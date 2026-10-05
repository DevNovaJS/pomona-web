import { redirect } from "next/navigation";

// 첫 화면은 배치 관리. 새벽 수집이 잘 됐는지부터 본다
export default function Home() {
  redirect("/batch");
}
