import { Badge } from '@/components/ui/badge'

export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
          <Badge variant="outline" className="mb-4 text-xs gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            법적 고지
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            개인정보처리방침
          </h1>
          <p className="text-muted-foreground">
            최종 업데이트: 2026년 4월 15일
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-12 w-full">
        <div className="prose prose-sm max-w-none text-sm leading-relaxed space-y-8 text-foreground">

          <div className="rounded-xl bg-muted/50 p-4 text-muted-foreground text-sm">
            VoxCierge(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 및 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </div>

          <section>
            <h2 className="text-xl font-bold mb-3">제1조 (수집하는 개인정보 항목)</h2>
            <p className="text-muted-foreground mb-3">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
            <div className="space-y-3">
              <div>
                <strong>필수 수집 항목</strong>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>이메일 주소 (회원가입 및 인증)</li>
                  <li>비밀번호 (암호화 저장)</li>
                  <li>서비스 이용 기록 (할 일, 완료 기록, 이용 시간)</li>
                </ul>
              </div>
              <div>
                <strong>선택 수집 항목</strong>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>이름 또는 닉네임</li>
                  <li>프로필 사진</li>
                </ul>
              </div>
              <div>
                <strong>음성 데이터</strong>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>음성 녹음 파일 (음성 캡처 기능 사용 시)</li>
                  <li>음성 전사(Transcription) 텍스트</li>
                </ul>
              </div>
              <div>
                <strong>자동 수집 항목</strong>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  <li>IP 주소, 브라우저 정보, 접속 로그</li>
                  <li>쿠키 및 세션 정보</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제2조 (개인정보 수집 및 이용 목적)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>회원 가입 및 관리, 본인 확인</li>
              <li>음성 기반 할 일 생성 및 AI 분석 서비스 제공</li>
              <li>데일리 브리핑, 스마트 체크인 등 부가 서비스 제공</li>
              <li>결제 처리 및 구독 관리</li>
              <li>고객 문의 처리 및 분쟁 해결</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
              <li>법령 및 이용약관 준수</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제3조 (음성 데이터 특별 처리 조항)</h2>
            <p className="text-muted-foreground mb-3">VoxCierge는 음성 데이터를 다음과 같이 특별히 처리합니다.</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>음성 파일은 AES-256 암호화 방식으로 저장됩니다.</li>
              <li>음성 데이터는 텍스트 전사 및 AI 의도 분석 목적으로만 처리됩니다.</li>
              <li>원본 음성 파일은 이용자의 계정 데이터와 함께 관리되며, 요청 시 삭제됩니다.</li>
              <li>음성 데이터는 AI 모델 학습 목적으로 사용되지 않습니다.</li>
              <li>음성 전사는 제3자 AI 서비스(Anthropic Claude API)를 통해 처리되며, 해당 서비스의 개인정보처리방침이 적용됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제4조 (개인정보 보유 및 이용 기간)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">항목</th>
                    <th className="text-left py-2 font-medium">보유 기간</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="py-2 pr-4">회원 정보</td>
                    <td className="py-2">탈퇴 후 30일</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">음성 데이터</td>
                    <td className="py-2">이용자 삭제 요청 시 즉시 삭제</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">결제 정보</td>
                    <td className="py-2">관계 법령에 따라 5년</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">접속 로그</td>
                    <td className="py-2">3개월</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">고객 문의 기록</td>
                    <td className="py-2">3년</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제5조 (개인정보의 제3자 제공)</h2>
            <p className="text-muted-foreground mb-3">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정 또는 수사기관의 적법한 요청이 있는 경우</li>
            </ul>
            <div className="mt-3">
              <strong>서비스 제공을 위한 수탁 업체</strong>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Supabase: 데이터베이스 및 인증 서비스</li>
                <li>Anthropic: AI 처리 서비스</li>
                <li>Stripe: 결제 처리 서비스</li>
                <li>Vercel: 서버 인프라</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제6조 (개인정보의 파기 절차 및 방법)</h2>
            <p className="text-muted-foreground mb-2">
              회사는 보유 기간이 경과하거나 처리 목적이 달성된 개인정보를 지체 없이 파기합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>전자적 파일:</strong> 복구 불가능한 방법으로 영구 삭제</li>
              <li><strong>출력물 등:</strong> 분쇄 또는 소각</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제7조 (이용자의 권리)</h2>
            <p className="text-muted-foreground mb-2">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정·삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>개인정보 이동권 (데이터 내보내기)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              권리 행사는 설정 &gt; 계정 메뉴 또는 support@voxcierge.com으로 요청하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제8조 (개인정보 보호책임자)</h2>
            <div className="text-muted-foreground">
              <p>개인정보 보호책임자: VoxCierge 운영팀</p>
              <p>연락처: support@voxcierge.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제9조 (방침의 변경)</h2>
            <p className="text-muted-foreground">
              이 개인정보처리방침은 2026년 4월 15일부터 적용됩니다. 방침 변경 시에는 시행일로부터 최소 7일 전에 이메일 또는 공지사항을 통해 안내합니다.
            </p>
          </section>

        </div>
      </section>
    </div>
  )
}
