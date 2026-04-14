'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ─── 목차 정의 ────────────────────────────────────────────────────────────────
const TOC = [
  { id: 'getting-started', label: '시작하기' },
  { id: 'voice-add', label: '음성으로 할 일 추가' },
  { id: 'task-manage', label: '할 일 관리' },
  { id: 'ai-briefing', label: 'AI 브리핑' },
  { id: 'checkin', label: '스마트 체크인' },
  { id: 'diary', label: '소설 일기장' },
  { id: 'calendar', label: '캘린더 연동' },
  { id: 'insights', label: '인사이트' },
  { id: 'settings', label: '설정 & 계정' },
]

// ─── 공통 목업 래퍼 ──────────────────────────────────────────────────────────
function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'relative mx-auto w-full max-w-[280px] rounded-[2rem] border-2 border-border bg-card shadow-xl overflow-hidden',
      className
    )}>
      {/* 상단 노치 */}
      <div className="flex items-center justify-between bg-card px-5 pt-3 pb-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          <div className="h-1.5 w-2.5 rounded-full bg-muted-foreground/60" />
          <div className="h-1.5 w-4 rounded-sm border border-muted-foreground/60 relative">
            <div className="absolute inset-0.5 right-0 bg-muted-foreground/60 rounded-[1px] w-2.5" />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── 목업 레이블 배지 ─────────────────────────────────────────────────────────
function MockLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
      {children}
    </span>
  )
}

// ─── 섹션 1: 회원가입 목업 ────────────────────────────────────────────────────
function SignupMockup() {
  return (
    <PhoneFrame>
      <div className="px-6 py-4 flex flex-col items-center gap-4 bg-background">
        {/* 로고 */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight">VoxCierge</span>
          <span className="text-[10px] text-muted-foreground">AI 음성 비서</span>
        </div>

        {/* 폼 */}
        <div className="w-full flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground font-medium px-0.5">이메일</span>
            <div className="h-8 rounded-lg border border-border bg-muted/30 px-3 flex items-center">
              <span className="text-[11px] text-muted-foreground">user@example.com</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground font-medium px-0.5">비밀번호</span>
            <div className="h-8 rounded-lg border border-border bg-muted/30 px-3 flex items-center">
              <span className="text-[11px] text-muted-foreground tracking-widest">••••••••</span>
            </div>
          </div>
          <div className="h-8 rounded-lg bg-primary flex items-center justify-center mt-1">
            <span className="text-[11px] font-semibold text-primary-foreground">회원가입</span>
          </div>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[9px] text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google */}
        <div className="w-full h-8 rounded-lg border border-border bg-card flex items-center justify-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500" />
          <span className="text-[10px] font-medium">Google로 계속하기</span>
        </div>

        <span className="text-[9px] text-muted-foreground text-center pb-3">
          가입 시 <span className="text-primary">이용약관</span>에 동의합니다
        </span>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 2: 음성 채팅 목업 ───────────────────────────────────────────────────
function VoiceChatMockup() {
  return (
    <PhoneFrame>
      {/* 헤더 */}
      <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          <span className="text-[11px] font-semibold text-primary-foreground">음성 어시스턴트</span>
        </div>
        <div className="h-5 w-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <span className="text-[9px] font-bold text-primary-foreground">2</span>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="bg-background px-3 py-3 flex flex-col gap-2.5 min-h-[220px]">
        {/* 세션 시작 */}
        <div className="flex justify-center">
          <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">세션 시작됨</span>
        </div>

        {/* 사용자 말풍선 ① */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-primary rounded-2xl rounded-tr-sm px-3 py-2">
            <p className="text-[10px] text-primary-foreground leading-relaxed">"내일 오후 3시 회의 준비해"</p>
          </div>
        </div>

        {/* AI 응답 카드 ② */}
        <div className="flex justify-start">
          <div className="max-w-[90%] bg-card rounded-2xl rounded-tl-sm border border-border px-3 py-2.5 flex flex-col gap-1.5">
            <span className="text-[9px] font-semibold text-primary">AI 분석 결과</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">📋</span>
              <span className="text-[10px] font-medium">회의 준비</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">⏰</span>
              <span className="text-[10px] text-muted-foreground">내일 15:00</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">📊</span>
              <span className="text-[10px] text-muted-foreground">신뢰도: 95%</span>
            </div>
            <div className="h-6 bg-primary rounded-md flex items-center justify-center mt-0.5">
              <span className="text-[9px] font-semibold text-primary-foreground">할 일로 저장</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 경고 + 버튼 */}
      <div className="bg-muted/50 border-t border-border px-3 py-2.5 flex flex-col items-center gap-2">
        <span className="text-[9px] text-muted-foreground flex items-center gap-1">
          <span>⚠</span> 세션 종료 시 분석 결과가 삭제됩니다
        </span>
        {/* 녹음 버튼 ③ */}
        <div className="h-11 w-11 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 2: FAB 버튼 목업 ────────────────────────────────────────────────────
function FabMockup() {
  return (
    <PhoneFrame>
      <div className="bg-background px-4 py-4 min-h-[180px] relative">
        {/* 앱 배경 시뮬레이션 */}
        <div className="flex flex-col gap-2 opacity-30">
          <div className="h-2 w-3/4 rounded-full bg-muted-foreground" />
          <div className="h-2 w-1/2 rounded-full bg-muted-foreground" />
          <div className="h-2 w-2/3 rounded-full bg-muted-foreground" />
          <div className="mt-3 h-2 w-4/5 rounded-full bg-muted-foreground" />
          <div className="h-2 w-3/5 rounded-full bg-muted-foreground" />
        </div>

        {/* FAB ④ */}
        <div className="absolute bottom-5 right-5">
          <div className="h-11 w-11 rounded-full bg-primary shadow-lg shadow-primary/50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </div>
          {/* 파동 효과 */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 scale-150 opacity-60" />
          <div className="absolute inset-0 rounded-full border border-primary/20 scale-[1.8] opacity-40" />
        </div>

        {/* 레이블 */}
        <div className="absolute bottom-6 right-16 bg-card border border-border rounded-lg px-2 py-1 shadow-sm">
          <span className="text-[9px] font-medium whitespace-nowrap">음성으로 추가</span>
        </div>
      </div>
      <div className="bg-muted/30 border-t border-border py-1.5 px-4 flex justify-around">
        {['🏠', '✅', '📊', '👤'].map((icon) => (
          <span key={icon} className="text-sm">{icon}</span>
        ))}
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 3: 할 일 목록 목업 ─────────────────────────────────────────────────
function TaskListMockup() {
  return (
    <PhoneFrame>
      {/* 헤더 */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between bg-card">
        <span className="text-[12px] font-bold">할 일 목록</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">총 5개</span>
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-[12px] font-bold text-primary-foreground leading-none">+</span>
          </div>
        </div>
      </div>

      {/* 탭 필터 ① */}
      <div className="flex border-b border-border bg-card">
        {['전체', '진행중', '완료', '연기'].map((tab, i) => (
          <button key={tab} className={cn(
            'flex-1 py-2 text-[9px] font-medium',
            i === 0 ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          )}>
            {tab}
          </button>
        ))}
      </div>

      {/* 할 일 목록 */}
      <div className="bg-background px-3 py-3 flex flex-col gap-2.5">
        {/* 진행중 카드 ② */}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">📋</span>
              <span className="text-[11px] font-semibold">회의 준비</span>
            </div>
            <span className="text-[8px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-full">!!높음</span>
          </div>
          <div className="flex items-center gap-1.5 pl-0.5">
            <span className="text-[10px] text-muted-foreground">⏰</span>
            <span className="text-[9px] text-muted-foreground">내일 15:00</span>
          </div>
          <div className="flex items-center gap-1.5 pl-0.5">
            <span className="text-[10px] text-muted-foreground">👤</span>
            <span className="text-[9px] text-muted-foreground">김팀장</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[9px] text-blue-600 font-medium">진행중</span>
          </div>
        </div>

        {/* 완료 카드 ③ */}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex flex-col gap-1.5 opacity-60">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">✅</span>
            <span className="text-[11px] font-semibold line-through text-muted-foreground">보고서 검토</span>
          </div>
          <div className="flex items-center gap-1.5 pl-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] text-green-600 font-medium">완료</span>
          </div>
        </div>

        {/* 연기 카드 */}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex flex-col gap-1.5 opacity-50">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">⏸</span>
            <span className="text-[11px] font-medium text-muted-foreground">자료 정리</span>
          </div>
          <div className="flex items-center gap-1.5 pl-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[9px] text-amber-600 font-medium">연기</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 4: AI 브리핑 목업 ───────────────────────────────────────────────────
function BriefingMockup() {
  return (
    <PhoneFrame>
      <div className="bg-background px-4 py-4 flex flex-col gap-3">
        {/* 상단 인사 */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">🌅</div>
          <div>
            <p className="text-[10px] font-semibold">안녕하세요, Dustin님</p>
            <p className="text-[9px] text-muted-foreground">2026년 4월 15일 화요일</p>
          </div>
        </div>

        {/* 브리핑 카드 ① */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-3.5 py-3 flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">📋</span>
            <span className="text-[11px] font-bold text-primary">오늘의 브리핑</span>
          </div>
          <p className="text-[10px] text-foreground leading-relaxed">
            "오늘은 <span className="font-semibold">3개의 할 일</span>이 예정되어 있습니다. 가장 중요한 것은 오후 3시 회의 준비이며, 완료율은 현재 60%입니다."
          </p>
          <div className="flex gap-2">
            {/* TTS 버튼 ② */}
            <div className="flex-1 h-7 rounded-lg bg-primary flex items-center justify-center gap-1">
              <span className="text-[9px]">🔊</span>
              <span className="text-[9px] font-semibold text-primary-foreground">브리핑 듣기</span>
            </div>
            {/* 재생성 버튼 ③ */}
            <div className="flex-1 h-7 rounded-lg border border-border bg-card flex items-center justify-center gap-1">
              <span className="text-[9px]">🔄</span>
              <span className="text-[9px] font-medium text-muted-foreground">새로 생성</span>
            </div>
          </div>
        </div>

        {/* 진행률 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="text-[9px] text-muted-foreground">오늘 진행률</span>
            <span className="text-[9px] font-bold text-primary">60%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-[60%] rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 5: 스마트 체크인 목업 ──────────────────────────────────────────────
function CheckinMockup() {
  return (
    <PhoneFrame>
      {/* 체크인 다이얼로그 */}
      <div className="bg-background/80 px-3 py-4 flex flex-col gap-3">
        <div className="flex flex-col items-center gap-0.5 mb-1">
          <span className="text-xl">👋</span>
          <p className="text-[11px] font-bold text-center">확인할 할 일이 있어요!</p>
          <p className="text-[9px] text-muted-foreground">오늘 처리가 필요한 항목입니다</p>
        </div>

        {/* 할 일 1 — 기한 초과 ① */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-semibold">보고서 제출</span>
            <span className="text-[8px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full font-medium">기한 초과</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]">⏰</span>
            <span className="text-[9px] text-destructive">어제 18:00 마감</span>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 h-6 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-center gap-0.5">
              <span className="text-[9px]">✅</span>
              <span className="text-[9px] font-medium text-green-700">완료</span>
            </div>
            <div className="flex-1 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-0.5">
              <span className="text-[9px]">⏰</span>
              <span className="text-[9px] font-medium text-amber-700">연기</span>
            </div>
            <div className="flex-1 h-6 rounded-md bg-muted border border-border flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">건너뛰기</span>
            </div>
          </div>
        </div>

        {/* 할 일 2 — 오늘 마감 ② */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-semibold">자료 정리</span>
            <span className="text-[8px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium">오늘 마감</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px]">⏰</span>
            <span className="text-[9px] text-amber-600">오늘 23:59</span>
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 h-6 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-center gap-0.5">
              <span className="text-[9px]">✅</span>
              <span className="text-[9px] font-medium text-green-700">완료</span>
            </div>
            <div className="flex-1 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center gap-0.5">
              <span className="text-[9px]">⏰</span>
              <span className="text-[9px] font-medium text-amber-700">연기</span>
            </div>
            <div className="flex-1 h-6 rounded-md bg-muted border border-border flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">건너뛰기</span>
            </div>
          </div>
        </div>

        {/* 완료 버튼 ③ */}
        <div className="h-8 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-[10px] font-semibold text-primary-foreground">모두 확인했어요</span>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 6: 소설 일기장 목업 ────────────────────────────────────────────────
function DiaryMockup() {
  return (
    <PhoneFrame>
      {/* 헤더 */}
      <div className="bg-card px-4 py-2.5 flex items-center justify-between border-b border-border">
        <span className="text-[11px] font-bold">📖 소설 일기장</span>
      </div>

      {/* 날짜 네비게이션 ① */}
      <div className="bg-card flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-[12px] text-muted-foreground">◀</span>
        <span className="text-[10px] font-medium">2026년 4월 15일 (화)</span>
        <span className="text-[12px] text-muted-foreground">▶</span>
      </div>

      {/* 일기 본문 ② */}
      <div className="bg-background px-4 py-3 flex flex-col gap-3">
        <div className="flex justify-end">
          <span className="text-xl">🌟</span>
        </div>
        <div className="bg-card rounded-xl border border-border p-3">
          <p className="text-[10px] text-foreground leading-relaxed italic">
            "오늘, 나는 드디어 그 보고서를 해치웠다. 오후의 회의는 치열한 전투 같았지만, 결국 승리를 거머쥐었다. 내일의 과제들이 기다리고 있지만..."
          </p>
        </div>

        {/* 통계 ③ */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] text-muted-foreground">완료 <span className="font-bold text-foreground">3</span></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[9px] text-muted-foreground">추가 <span className="font-bold text-foreground">2</span></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[9px] text-muted-foreground">연기 <span className="font-bold text-foreground">1</span></span>
          </div>
        </div>

        {/* TTS 버튼 ④ */}
        <div className="h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-1.5">
          <span className="text-[10px]">🔊</span>
          <span className="text-[10px] font-medium text-primary">일기 읽어주기</span>
        </div>

        {/* 보관 안내 */}
        <div className="flex items-center justify-center gap-1 pb-1">
          <span className="text-[9px]">💡</span>
          <span className="text-[9px] text-muted-foreground">30일간 보관 · 백업 가능</span>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 7: 캘린더 연동 목업 ────────────────────────────────────────────────
function CalendarConnectMockup() {
  return (
    <PhoneFrame>
      <div className="bg-background px-4 py-3 flex flex-col gap-3">
        <p className="text-[11px] font-bold">📅 캘린더 연동</p>

        {/* Google ① */}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-yellow-400 opacity-90" />
            <span className="text-[10px] font-semibold">Google Calendar</span>
          </div>
          <div className="flex items-center gap-1.5 pl-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[9px] text-green-600 font-medium">연결됨</span>
          </div>
          <span className="text-[9px] text-muted-foreground pl-0.5">user@gmail.com</span>
          <div className="h-6 rounded-md border border-destructive/40 bg-destructive/5 flex items-center justify-center mt-0.5">
            <span className="text-[9px] text-destructive font-medium">연결 해제</span>
          </div>
        </div>

        {/* Outlook ② */}
        <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">Ot</span>
            </div>
            <span className="text-[10px] font-semibold">Microsoft Outlook</span>
          </div>
          <div className="flex items-center gap-1.5 pl-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">미연결</span>
          </div>
          <div className="h-6 rounded-md bg-primary flex items-center justify-center mt-0.5">
            <span className="text-[9px] text-primary-foreground font-medium">연결하기</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function CalendarConflictMockup() {
  return (
    <PhoneFrame>
      <div className="bg-background px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⚠️</span>
          <p className="text-[11px] font-bold">일정이 겹쳐요!</p>
        </div>

        {/* 충돌 시각화 ③ */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-sm bg-blue-400" />
            <span className="text-[9px]">기존: 팀 회의 14:00~15:00</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-sm bg-red-400" />
            <span className="text-[9px]">새로: 보고서 리뷰 14:30</span>
          </div>
        </div>

        {/* AI 추천 ④ */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] font-semibold text-primary">AI 추천 시간</span>
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-1.5">
            <span className="text-[9px]">✅</span>
            <span className="text-[9px] font-medium">오늘 15:30~16:30 (빈 시간)</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-1.5">
            <span className="text-[9px]">✅</span>
            <span className="text-[9px] font-medium">내일 10:00~11:00</span>
          </div>
        </div>

        {/* 선택 버튼 */}
        <div className="flex gap-2">
          <div className="flex-1 h-7 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-[9px] font-semibold text-primary-foreground">추천 시간으로</span>
          </div>
          <div className="flex-1 h-7 rounded-xl border border-border bg-card flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">그대로 유지</span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 8: 인사이트 목업 ────────────────────────────────────────────────────
function InsightsMockup() {
  const heatmap = [
    { day: '월', pct: 50 }, { day: '화', pct: 100 }, { day: '수', pct: 75 },
    { day: '목', pct: 60 }, { day: '금', pct: 30 }, { day: '토', pct: 10 },
  ]
  return (
    <PhoneFrame>
      <div className="bg-background px-4 py-3 flex flex-col gap-3">
        <p className="text-[11px] font-bold">📊 생산성 인사이트</p>

        {/* 완료율 ① */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-muted-foreground">이번 주 완료율</span>
            <span className="text-[10px] font-bold text-primary">78%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary to-primary/70" />
          </div>
        </div>

        {/* 통계 카드 ② */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-card px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground">가장 생산적인 요일</span>
            <span className="text-[11px] font-bold text-primary">화요일</span>
          </div>
          <div className="rounded-xl border border-border bg-card px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] text-muted-foreground">최적 시간대</span>
            <span className="text-[11px] font-bold text-primary">오전 10~12시</span>
          </div>
        </div>

        {/* 히트맵 ③ */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] text-muted-foreground font-medium">주간 히트맵</span>
          <div className="flex gap-1">
            {heatmap.map(({ day, pct }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-primary"
                  style={{ height: `${Math.max(4, pct * 0.32)}px`, opacity: pct / 100 * 0.8 + 0.2 }}
                />
                <span className="text-[8px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 주간 요약 */}
        <div className="rounded-xl border border-border bg-card px-3 py-2 flex items-center gap-2">
          <span className="text-base">🏆</span>
          <div>
            <p className="text-[9px] font-semibold">이번 주 최고 기록!</p>
            <p className="text-[9px] text-muted-foreground">23개 완료 · 지난 주 대비 +15%</p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── 섹션 래퍼 ────────────────────────────────────────────────────────────────
function Section({
  id,
  emoji,
  title,
  subtitle,
  children,
}: {
  id: string
  emoji: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 py-14 md:py-20 border-b border-border last:border-0">
      <div className="flex flex-col gap-3 mb-10">
        <span className="text-3xl">{emoji}</span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h2>
        <p className="text-muted-foreground leading-relaxed max-w-lg">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

// ─── 설명 + 목업 쌍 레이아웃 ─────────────────────────────────────────────────
function MockupRow({
  mockup,
  description,
  reverse = false,
}: {
  mockup: React.ReactNode
  description: React.ReactNode
  reverse?: boolean
}) {
  return (
    <div className={cn(
      'flex flex-col md:flex-row items-center gap-10 md:gap-16',
      reverse && 'md:flex-row-reverse'
    )}>
      <div className="w-full md:w-auto shrink-0">{mockup}</div>
      <div className="flex-1">{description}</div>
    </div>
  )
}

// ─── 설명 목록 ────────────────────────────────────────────────────────────────
function DescList({ items }: { items: { label: React.ReactNode | string; text: string }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          {typeof item.label === 'string' ? (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">
              {item.label}
            </span>
          ) : item.label}
          <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
        </li>
      ))}
    </ul>
  )
}

// ─── 팁 박스 ─────────────────────────────────────────────────────────────────
function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mt-4">
      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  )
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    TOC.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── 히어로 ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <Badge variant="outline" className="mb-6 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            사용 가이드
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            VoxCierge{' '}
            <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              완벽 가이드
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
            음성 기반 AI 비서의 모든 기능을 한눈에. 스크린샷 없이 CSS 목업으로 실제 앱을 미리 경험해 보세요.
          </p>
        </div>
      </div>

      {/* ── 콘텐츠 영역 ──────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-6xl px-4 flex gap-12">
        {/* ── 사이드바 (sticky) ── */}
        <aside className="hidden lg:flex flex-col w-52 shrink-0 pt-14">
          <nav className="sticky top-20 flex flex-col gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">목차</p>
            {TOC.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={cn(
                  'text-sm px-3 py-1.5 rounded-lg transition-colors',
                  activeSection === id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* ── 모바일 수평 목차 ── */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto flex gap-2 py-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          {TOC.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={cn(
                'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border',
                activeSection === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {label}
            </a>
          ))}
        </div>

        {/* ── 본문 ── */}
        <main className="flex-1 min-w-0 pt-4 lg:pt-0">

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 1: 시작하기                                          */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="getting-started"
            emoji="🚀"
            title="시작하기"
            subtitle="이메일 하나만 있으면 됩니다. 신용카드 없이 무료로 시작하세요."
          >
            <MockupRow
              mockup={<SignupMockup />}
              description={
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4">
                    <DescList items={[
                      { label: '1', text: '이메일 주소와 비밀번호를 입력해 회원가입합니다.' },
                      { label: '2', text: 'Google 소셜 로그인도 지원합니다. 별도 비밀번호 없이 가입 가능.' },
                      { label: '3', text: '이메일 인증 링크를 클릭하면 즉시 사용 가능합니다.' },
                    ]} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-base font-bold">무료 플랜 포함 기능</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['음성 인식 월 30회', 'AI 브리핑 주 3회', '소설 일기장 7일 보관', '캘린더 연동 1개'].map((f) => (
                        <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <TipBox>가입 직후 이메일 인증을 완료해야 음성 기능을 사용할 수 있습니다.</TipBox>
                </div>
              }
            />
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 2: 음성으로 할 일 추가                               */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="voice-add"
            emoji="🎙️"
            title="음성으로 할 일 추가"
            subtitle="말하면 AI가 자동으로 분석해 할 일로 변환합니다."
          >
            <div className="flex flex-col gap-14">
              {/* 목업 1: 채팅 UI */}
              <MockupRow
                mockup={<VoiceChatMockup />}
                description={
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-bold">음성 어시스턴트 채팅</h3>
                    <DescList items={[
                      { label: '①', text: '상단에 현재 세션에서 인식된 할 일 건수가 표시됩니다.' },
                      { label: '②', text: 'AI가 분석한 결과를 채팅 형식으로 보여줍니다. 제목·마감·신뢰도를 한눈에.' },
                      { label: '③', text: '"할 일로 저장" 버튼을 눌러 등록하거나, 결과를 무시하고 다시 말할 수 있습니다.' },
                    ]} />
                    <TipBox>"내일 오후 3시에 김팀장과 회의", "이번 주 금요일까지 보고서 제출" — 구체적일수록 인식률이 높아집니다.</TipBox>
                  </div>
                }
              />

              {/* 목업 2: FAB 버튼 */}
              <MockupRow
                reverse
                mockup={<FabMockup />}
                description={
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-bold">어디서나 🎙 버튼으로 빠르게</h3>
                    <DescList items={[
                      { label: '④', text: '모든 페이지 우측 하단에 고정된 퍼플 마이크 버튼이 있습니다.' },
                      { label: '5', text: '버튼을 누르면 바로 음성 녹음이 시작됩니다. 페이지 이동 없이 즉시 추가.' },
                      { label: '6', text: '세션 종료 시 저장되지 않은 분석 결과는 삭제됩니다. 바로 저장하세요.' },
                    ]} />
                  </div>
                }
              />
            </div>
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 3: 할 일 관리                                       */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="task-manage"
            emoji="✅"
            title="할 일 관리"
            subtitle="음성으로 추가한 할 일을 한 곳에서 정리하고 추적합니다."
          >
            <MockupRow
              mockup={<TaskListMockup />}
              description={
                <div className="flex flex-col gap-4">
                  <DescList items={[
                    { label: '①', text: '탭으로 전체 / 진행중 / 완료 / 연기 상태별로 빠르게 필터링합니다.' },
                    { label: '②', text: '진행중인 할 일은 제목·마감·담당자·우선순위가 카드에 표시됩니다.' },
                    { label: '③', text: '완료된 항목은 취소선으로 표시되고 반투명하게 처리됩니다.' },
                  ]} />
                  <div className="flex flex-col gap-2 mt-2">
                    <h3 className="text-sm font-bold">기타 기능</h3>
                    <ul className="flex flex-col gap-1.5">
                      {[
                        '검색으로 빠르게 찾기',
                        '카드 클릭 시 상세 보기 & 편집',
                        '우선순위 / 마감일 / 카테고리 조정',
                        '"+ 추가" 버튼으로 수동 등록도 가능',
                      ].map((t) => (
                        <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-primary shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <TipBox>할 일을 길게 누르면 빠른 상태 변경 메뉴가 나타납니다.</TipBox>
                </div>
              }
            />
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 4: AI 브리핑                                        */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="ai-briefing"
            emoji="📋"
            title="AI 브리핑"
            subtitle="매일 아침 AI가 오늘의 할 일을 요약해 알려줍니다."
          >
            <MockupRow
              reverse
              mockup={<BriefingMockup />}
              description={
                <div className="flex flex-col gap-4">
                  <DescList items={[
                    { label: '①', text: '홈 화면 상단에 오늘의 브리핑 카드가 자동으로 표시됩니다.' },
                    { label: '②', text: '"브리핑 듣기" 버튼으로 TTS 음성 재생. 운전 중, 손 씻는 중에도 OK.' },
                    { label: '③', text: '"새로 생성"으로 최신 할 일 상태를 반영한 브리핑을 즉시 다시 생성합니다.' },
                  ]} />
                  <TipBox>설정 → 알림에서 브리핑 수신 시간을 원하는 시각으로 조정하세요. 기본값은 오전 8시.</TipBox>
                </div>
              }
            />
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 5: 스마트 체크인                                    */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="checkin"
            emoji="👋"
            title="스마트 체크인"
            subtitle="앱을 열 때마다 AI가 놓친 할 일을 자동으로 확인시켜 줍니다."
          >
            <MockupRow
              mockup={<CheckinMockup />}
              description={
                <div className="flex flex-col gap-4">
                  <DescList items={[
                    { label: '①', text: '기한이 지난 항목은 빨간 테두리로 강조됩니다. 즉시 처리하거나 연기하세요.' },
                    { label: '②', text: '오늘 마감인 항목은 노란 테두리로 표시됩니다. 완료 / 연기 / 건너뛰기 중 선택.' },
                    { label: '③', text: '"모두 확인했어요" 버튼으로 체크인을 종료하면 하루에 한 번만 다시 표시됩니다.' },
                  ]} />
                  <div className="flex flex-col gap-2 mt-1">
                    <h3 className="text-sm font-bold">연기 기능</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      연기를 선택하면 다음 날 / 다음 주 / 날짜 직접 선택으로 마감일을 미룰 수 있습니다.
                    </p>
                  </div>
                  <TipBox>저녁 체크인에서는 하루 마감 요약도 함께 제공됩니다. 성취감을 느껴보세요.</TipBox>
                </div>
              }
            />
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 6: 소설 일기장                                      */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="diary"
            emoji="📖"
            title="소설 일기장"
            subtitle="AI가 하루의 할 일을 소설 형식의 이야기로 정리해 줍니다."
          >
            <MockupRow
              reverse
              mockup={<DiaryMockup />}
              description={
                <div className="flex flex-col gap-4">
                  <DescList items={[
                    { label: '①', text: '날짜 네비게이션으로 과거 일기를 쉽게 탐색합니다.' },
                    { label: '②', text: 'AI가 완료한 일은 영웅담으로, 못한 일은 내일의 복선으로 소설처럼 서술합니다.' },
                    { label: '③', text: '완료·추가·연기 통계로 하루의 생산성을 한눈에 확인합니다.' },
                    { label: '④', text: 'TTS 낭독 기능으로 일기를 눈을 감고도 들을 수 있습니다.' },
                  ]} />
                  <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-start gap-3 mt-1">
                    <span className="text-lg shrink-0">💾</span>
                    <div>
                      <p className="text-sm font-medium mb-0.5">보관 정책</p>
                      <p className="text-sm text-muted-foreground">일기는 30일간 보관됩니다. 마크다운 형식으로 백업 내보내기가 가능합니다.</p>
                    </div>
                  </div>
                </div>
              }
            />
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 7: 캘린더 연동                                      */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="calendar"
            emoji="📅"
            title="캘린더 연동"
            subtitle="Google / Outlook 캘린더와 연동해 일정 충돌을 AI가 해결해 줍니다."
          >
            <div className="flex flex-col gap-10">
              <MockupRow
                mockup={<CalendarConnectMockup />}
                description={
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-bold">연동 설정</h3>
                    <DescList items={[
                      { label: '①', text: 'Google Calendar는 OAuth로 안전하게 연결됩니다. 이메일 주소가 표시됩니다.' },
                      { label: '②', text: 'Microsoft Outlook도 지원합니다. 한 번에 여러 캘린더 연결 가능.' },
                    ]} />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      설정 → 캘린더 연동 메뉴에서 관리할 수 있습니다.
                    </p>
                  </div>
                }
              />

              <MockupRow
                reverse
                mockup={<CalendarConflictMockup />}
                description={
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-bold">충돌 자동 감지</h3>
                    <DescList items={[
                      { label: '③', text: '음성으로 일정을 등록하면 기존 캘린더와 겹치는지 자동으로 확인합니다.' },
                      { label: '④', text: 'AI가 빈 시간대를 분석해 2개 이상의 대안 시간을 추천합니다.' },
                    ]} />
                    <TipBox>캘린더 연동 시 일정을 음성으로 말하면 자동으로 캘린더에도 추가됩니다.</TipBox>
                  </div>
                }
              />
            </div>
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 8: 인사이트                                         */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="insights"
            emoji="📊"
            title="인사이트"
            subtitle="나의 생산성 패턴을 데이터로 파악하고 업무 습관을 개선합니다."
          >
            <MockupRow
              mockup={<InsightsMockup />}
              description={
                <div className="flex flex-col gap-4">
                  <DescList items={[
                    { label: '①', text: '이번 주 완료율 — 전체 등록 대비 완료된 할 일의 비율입니다.' },
                    { label: '②', text: '가장 생산적인 요일과 최적 시간대를 분석해 업무 스케줄 최적화를 도와줍니다.' },
                    { label: '③', text: '요일별 완료 히트맵으로 패턴을 시각적으로 확인합니다.' },
                  ]} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {[
                      { label: '주간 리포트', desc: '매주 월요일 지난 주 요약 수신' },
                      { label: '월간 리포트', desc: '월초에 지난 달 성과 분석 제공' },
                      { label: '목표 설정', desc: '주간 완료 목표를 스스로 설정' },
                      { label: '내보내기', desc: 'CSV로 데이터 다운로드 가능' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-border bg-card px-3 py-2.5">
                        <p className="text-xs font-semibold mb-0.5">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              }
            />
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 섹션 9: 설정 & 계정                                      */}
          {/* ────────────────────────────────────────────────────────── */}
          <Section
            id="settings"
            emoji="⚙️"
            title="설정 & 계정"
            subtitle="프로필부터 구독 관리까지 모든 설정을 한 곳에서."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: '👤',
                  title: '프로필 편집',
                  desc: '이름, 프로필 사진, 타임존을 설정합니다.',
                },
                {
                  icon: '🔔',
                  title: '알림 설정',
                  desc: '브리핑 시간, 체크인 알림, 마감 리마인더를 설정합니다.',
                },
                {
                  icon: '💳',
                  title: '구독 관리',
                  desc: '현재 플랜 확인, 업그레이드, 결제 수단 변경.',
                },
                {
                  icon: '🌙',
                  title: '다크 모드',
                  desc: '라이트 / 다크 / 시스템 설정 자동을 선택합니다.',
                },
                {
                  icon: '📤',
                  title: '데이터 내보내기',
                  desc: '할 일·일기 데이터를 JSON / CSV로 내보냅니다.',
                },
                {
                  icon: '🔒',
                  title: '보안',
                  desc: '비밀번호 변경, 2단계 인증, 세션 관리.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2.5">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ────────────────────────────────────────────────────────── */}
          {/* 팁 & 트릭                                                */}
          {/* ────────────────────────────────────────────────────────── */}
          <section className="py-14">
            <div className="flex flex-col gap-3 mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight">💡 팁 &amp; 트릭</h2>
              <p className="text-muted-foreground">VoxCierge를 200% 활용하는 프로 팁</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                {
                  num: '01',
                  title: '구체적으로 말할수록 AI 인식률 UP',
                  desc: '"회의"보다 "내일 오후 3시에 김팀장과 전략 회의 준비"가 훨씬 정확합니다.',
                },
                {
                  num: '02',
                  title: '매일 브리핑으로 하루를 시작하세요',
                  desc: '아침 브리핑 TTS를 켜두면 출근길에도 오늘 일정을 확인할 수 있습니다.',
                },
                {
                  num: '03',
                  title: '일기장은 30일만 보관 — 정기적으로 백업',
                  desc: '설정 → 데이터 내보내기에서 마크다운 파일로 저장하는 습관을 들이세요.',
                },
                {
                  num: '04',
                  title: '다크 모드로 눈의 피로를 줄이세요',
                  desc: '저녁 체크인, 취침 전 일기장 확인 시 다크 모드를 권장합니다.',
                },
                {
                  num: '05',
                  title: '🎙 버튼 = 어디서나 음성 추가',
                  desc: '아무 페이지에서나 우측 하단 마이크 버튼을 누르면 즉시 음성 추가 모드로 진입합니다.',
                },
              ].map((tip) => (
                <div key={tip.num} className="flex items-start gap-5 rounded-2xl border border-border bg-card px-5 py-4">
                  <span className="text-2xl font-black text-primary/20 shrink-0 leading-none">{tip.num}</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold">{tip.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <div className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight mb-3">지금 바로 시작하세요</h2>
          <p className="text-muted-foreground mb-8">무료 플랜으로 VoxCierge를 경험하고, 필요할 때 업그레이드하세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'gap-2 px-8')}>
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/faq" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-8')}>
              자주 묻는 질문
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
