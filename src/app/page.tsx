"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

const goal자산 = 100000000;

export default function Home() {
  const [자산, set자산] = useState(1100);
  const [목표저축액, set목표저축액] = useState(1000000);
  const [경과달수, set경과달수] = useState(1);
  const [예상달성기한, set예상달성기한] = useState(12); // 단위는 달

  const [예금, set예금] = useState(0);
  const [주식, set주식] = useState(0);
  const [적금, set적금] = useState(0);
  const [기타, set기타] = useState(0);

  const 총자산 = 예금 + 주식 + 적금 + 기타;

  return (
    <div className="font-sans flex flex-col gap-y-[10px] items-center">
      <Card className="bg-emerald-500 w-full">
        <CardHeader>
          <CardTitle>지금 내 자산</CardTitle>
          <CardDescription>{총자산.toLocaleString()}원</CardDescription>
        </CardHeader>
      </Card>
      <div>
        <div>매달 {목표저축액.toLocaleString()}원 씩 저축하면</div>
        <div>
          {goal자산.toLocaleString()}원까지 {goal자산 / 목표저축액}개월 만에
          달성할 수 있습니다.
        </div>
        {(goal자산 / 예상달성기한) * 경과달수 > 총자산 ? (
          <div>이대로라면 예상 달성 기한 내에 1억을 모을 수 없어요</div>
        ) : (
          <div>이대로라면 예정대로/예정보다 더 빨리 1억을 모을 수 있어요</div>
        )}
      </div>
      <div></div>
    </div>
  );
}
