/**
 * Supabase Auth 에러 메시지 한국어 매핑
 */

const ERROR_MAP: Record<string, string> = {
  // 인증 관련
  'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'Email not confirmed': '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.',
  'User already registered': '이미 가입된 이메일입니다.',
  'User not found': '가입되지 않은 이메일입니다.',
  'Invalid email or password': '이메일 또는 비밀번호가 올바르지 않습니다.',

  // 비밀번호 관련
  'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
  'Password should be at least 8 characters': '비밀번호는 최소 8자 이상이어야 합니다.',
  'New password should be different from the old password': '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
  'Weak password': '비밀번호가 너무 단순합니다. 더 복잡한 비밀번호를 사용해 주세요.',

  // 이메일 관련
  'Invalid email': '올바르지 않은 이메일 형식입니다.',
  'Email link is invalid or has expired': '이메일 링크가 유효하지 않거나 만료되었습니다.',
  'Token has expired or is invalid': '인증 토큰이 만료되었거나 유효하지 않습니다.',
  'Email rate limit exceeded': '이메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',

  // 세션/토큰 관련
  'JWT expired': '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
  'Invalid JWT': '유효하지 않은 세션입니다. 다시 로그인해 주세요.',
  'Session expired': '세션이 만료되었습니다. 다시 로그인해 주세요.',
  'No session': '로그인이 필요합니다.',
  'Refresh Token Not Found': '세션이 만료되었습니다. 다시 로그인해 주세요.',

  // 요청 제한
  'For security purposes, you can only request this once every 60 seconds': '보안을 위해 60초에 한 번만 요청할 수 있습니다.',
  'Too many requests': '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  'Rate limit exceeded': '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',

  // OAuth 관련
  'OAuth error': '소셜 로그인 중 오류가 발생했습니다.',
  'Provider not found': '지원하지 않는 로그인 방식입니다.',

  // 계정 상태
  'User is banned': '계정이 정지되었습니다. 고객센터에 문의해 주세요.',
  'Signup disabled': '현재 회원가입이 비활성화되어 있습니다.',

  // 일반 네트워크/서버
  'Network error': '네트워크 연결을 확인해 주세요.',
  'Internal server error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  'Service unavailable': '서비스가 일시적으로 중단되었습니다. 잠시 후 다시 시도해 주세요.',
}

/**
 * Supabase 에러 메시지를 한국어로 변환합니다.
 * 매핑이 없는 경우 원본 메시지를 반환합니다.
 */
export function mapSupabaseError(error: unknown): string {
  if (!error) return '알 수 없는 오류가 발생했습니다.'

  let message: string

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as { message: unknown }).message)
  } else if (typeof error === 'string') {
    message = error
  } else {
    return '알 수 없는 오류가 발생했습니다.'
  }

  // 정확한 매핑 시도
  if (ERROR_MAP[message]) {
    return ERROR_MAP[message]
  }

  // 부분 일치 시도 (에러 메시지에 키가 포함된 경우)
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  return message
}
