import { Badge } from '@/components/ui/badge'

export default function TermsPage() {
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
            이용약관
          </h1>
          <p className="text-muted-foreground">
            최종 업데이트: 2026년 4월 15일
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-4 py-12 w-full">
        <div className="space-y-8 text-sm leading-relaxed">

          <div className="rounded-xl bg-muted/50 p-4 text-muted-foreground">
            본 이용약관(이하 &ldquo;약관&rdquo;)은 주식회사 스터닝박스(이하 &ldquo;회사&rdquo;)가 제공하는 VoxCierge 서비스의 이용 조건 및 절차에 관한 사항을 규정합니다. 서비스에 가입하거나 이용함으로써 본 약관에 동의한 것으로 간주됩니다.
          </div>

          <section>
            <h2 className="text-xl font-bold mb-3">제1조 (목적)</h2>
            <p className="text-muted-foreground">
              본 약관은 회사가 제공하는 VoxCierge 음성 기반 지능형 업무 비서 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제2조 (서비스 설명)</h2>
            <p className="text-muted-foreground mb-2">
              VoxCierge는 다음과 같은 서비스를 제공합니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>음성 기반 할 일 생성 및 관리</li>
              <li>AI 의도 분석 및 자동 정리</li>
              <li>데일리 브리핑 및 스마트 체크인</li>
              <li>생산성 인사이트 분석</li>
              <li>AI 일기 생성</li>
              <li>캘린더 연동 및 일정 관리</li>
              <li>기타 회사가 추가로 개발하거나 제공하는 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제3조 (회원 가입 및 계정)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>서비스 이용을 위해 이메일 주소와 비밀번호로 계정을 생성해야 합니다.</li>
              <li>이용자는 정확하고 최신의 정보를 제공해야 합니다.</li>
              <li>계정은 양도할 수 없으며, 계정 보안의 책임은 이용자에게 있습니다.</li>
              <li>타인의 계정을 무단으로 이용하는 행위는 금지됩니다.</li>
              <li>만 14세 미만은 법정대리인의 동의 없이 가입할 수 없습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제4조 (이용자의 의무)</h2>
            <p className="text-muted-foreground mb-2">이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>허위 정보 등록 또는 타인 정보 도용</li>
              <li>서비스를 통해 불법·유해 콘텐츠 생성 또는 유포</li>
              <li>서비스의 정상적인 운영 방해 (해킹, 크롤링, DDoS 등)</li>
              <li>지식재산권 침해 행위</li>
              <li>타인의 개인정보 무단 수집 또는 이용</li>
              <li>상업적 목적의 무단 이용 (API 재판매, 스크래핑 등)</li>
              <li>관계 법령을 위반하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제5조 (음성 데이터 관련 조항)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>이용자는 서비스 이용 목적에 부합하는 음성만 녹음해야 합니다.</li>
              <li>제3자의 동의 없이 타인의 음성을 무단으로 녹음하여 서비스에 업로드해서는 안 됩니다.</li>
              <li>불법·유해 내용이 포함된 음성 녹음은 금지됩니다.</li>
              <li>이용자가 제공한 음성 데이터의 법적 책임은 이용자에게 있습니다.</li>
              <li>음성 데이터는 개인정보처리방침에 따라 처리됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제6조 (구독 및 결제)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>유료 서비스는 월간 또는 연간 구독으로 제공됩니다.</li>
              <li>구독 요금은 구독 갱신일에 자동으로 청구됩니다.</li>
              <li>구독 해지는 언제든지 가능하며, 해지 후 현재 구독 기간 만료까지 서비스를 이용할 수 있습니다.</li>
              <li>환불 정책: 결제 후 7일 이내 요청 시 전액 환불하며, 이후에는 환불이 제한될 수 있습니다.</li>
              <li>요금은 회사의 정책에 따라 변경될 수 있으며, 변경 시 30일 전 이메일로 안내합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제7조 (서비스 제한 및 정지)</h2>
            <p className="text-muted-foreground mb-2">
              회사는 다음의 경우 서비스를 제한하거나 계정을 정지할 수 있습니다.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>이용약관 위반 시</li>
              <li>결제 미납 또는 결제 수단 문제 발생 시</li>
              <li>서비스 남용 또는 비정상적 이용 패턴이 감지될 시</li>
              <li>법령 위반 또는 수사기관의 요청이 있을 시</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제8조 (지식재산권)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>서비스 및 서비스 내 모든 콘텐츠에 대한 지식재산권은 회사에 귀속됩니다.</li>
              <li>이용자가 서비스를 통해 생성한 할 일, 일기 등의 콘텐츠는 이용자에게 귀속됩니다.</li>
              <li>이용자는 서비스 내 콘텐츠를 서비스 이용 목적 외로 복제·배포할 수 없습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제9조 (책임 제한)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>회사는 천재지변, 불가항력, 통신 장애 등 회사의 귀책사유 없는 서비스 중단에 대해 책임을 지지 않습니다.</li>
              <li>AI가 생성하는 콘텐츠(브리핑, 일기, 분석 등)의 정확성에 대해 회사는 보증하지 않습니다.</li>
              <li>이용자 간 또는 이용자와 제3자 간 분쟁에 대해 회사는 개입하지 않습니다.</li>
              <li>회사의 손해배상 최대 한도는 해당 월 이용 요금을 초과하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제10조 (분쟁 해결)</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>본 약관 관련 분쟁 발생 시 회사와 이용자는 먼저 협의를 통해 해결하려 노력합니다.</li>
              <li>협의가 이루어지지 않는 경우, 관련 법령에 따른 분쟁 조정 기관 또는 법원에 제소할 수 있습니다.</li>
              <li>소송 관할 법원은 대한민국 서울중앙지방법원으로 합니다.</li>
              <li>본 약관은 대한민국 법률에 따라 해석됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">제11조 (약관의 변경)</h2>
            <p className="text-muted-foreground">
              회사는 합리적인 사유가 있는 경우 약관을 변경할 수 있습니다. 변경 시에는 적용일 최소 7일 전에 이메일 또는 서비스 내 공지를 통해 안내합니다. 변경된 약관에 동의하지 않는 이용자는 탈퇴할 수 있습니다.
            </p>
          </section>

          <div className="border-t pt-6 text-xs text-muted-foreground">
            <p>본 약관은 2026년 4월 15일부터 시행됩니다.</p>
            <p className="mt-1">문의: recollect@hawoolab.app</p>
            <p className="mt-0.5">주식회사 스터닝박스 | 대표: CHUNG MINDY SUMIN | 전화: 050-6881-1222</p>
          </div>

        </div>
      </section>
    </div>
  )
}
