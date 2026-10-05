import { redirect } from "next/navigation";

// 첫 화면은 배치 관리로 둘 예정. 그 화면을 만들기 전까지는 리뷰로 보낸다
export default function Home() {
  redirect("/reviews");
}
