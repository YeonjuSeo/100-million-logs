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
    <div className="font-sans flex flex-col gap-y-[10px] items-center px-[6px] py-[20px]">
      <Card className="bg-emerald-500 w-full text-white">
        <CardHeader>
          <CardTitle>지금 내 자산</CardTitle>
        </CardHeader>
        <CardContent>
          <div>{총자산.toLocaleString()}원 </div>
        </CardContent>
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
      <div>
        <div>
          <label>목표 달성 기한 설정하기 약</label>
          <input
            type="number"
            value={예상달성기한}
            onChange={(e) => set예상달성기한(Number(e.target.value))}
          />
          <span>개월 안에 목표 금액 달성하기!</span>
          <span>
            예상 달성 일자{" "}
            {new Date(
              new Date().setMonth(new Date().getMonth() + 예상달성기한)
            ).toLocaleDateString()}
          </span>
        </div>
        <div>추천 매달 저축액 목표 {goal자산 / 예상달성기한}원</div>
        <div>
          <label>목표 매달 저축액 설정하기</label>
          <input
            type="number"
            value={목표저축액}
            onChange={(e) => set목표저축액(Number(e.target.value))}
          />
        </div>
        <div>
          {goal자산 / 예상달성기한 > 목표저축액 ? (
            <div>
              이대로라면 예상 달성 기한 안에 목표 금액을 달성할 수 없어요.
              목표를 조정해보는 건 어떨까요? 추천 목표 금액은{" "}
              {Math.floor(goal자산 / 예상달성기한)}원이에요. 추천 달성 기한은{" "}
              {Math.floor(goal자산 / 목표저축액)}개월이에요.
            </div>
          ) : (
            <div>추천 매달 저축액 목표 {목표저축액}원</div>
          )}
        </div>
        <div>
          <span>이 여정은</span>
          <input
            type="date"
            value={new Date().toISOString().split("T")[0]}
            onChange={(e) => set경과달수(Number(e.target.value))}
          />
          <span>부터 시작되었어요</span>
        </div>
        <div>
          <label>지금 내 예금 자산 입력하기</label>
          <input
            type="number"
            value={예금}
            onChange={(e) => set예금(Number(e.target.value))}
          />
        </div>
        <div>
          <label>지금 내 주식 자산 입력하기</label>
          <input
            type="number"
            value={주식}
            onChange={(e) => set주식(Number(e.target.value))}
          />
        </div>
        <div>
          <label>지금 내 적금 자산 입력하기</label>
          <input
            type="number"
            value={적금}
            onChange={(e) => set적금(Number(e.target.value))}
          />
        </div>
        <div>
          <label>지금 내 기타 자산 입력하기</label>
          <input
            type="number"
            value={기타}
            onChange={(e) => set기타(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
