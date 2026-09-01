export default [
  {
    files: ['**/*.js'], // 모든 js 파일에 아래 규칙을 적용

    ignores: ['node_modules/**'], // 검사에서 제외할 폴더

    rules: {
      'no-unused-vars': 'warn', // 선언 뒤 사용하지 않은 변수는 경고 
    },
  },
];