import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "no-console": "error", // console.log 사용시 에러
      "no-use-before-define": ["error", { functions: false }], // 함수 선언 전 사용시 에러
      "comma-dangle": ["error", "always-multiline"], // 마지막 쉼표 에러
      "indent": ["error", 2], // 들여쓰기 2칸
      "quotes": ["error", "double"], // 문자열 큰따옴표
      "eol-last": ["error", "always"], // 파일 끝에 빈 줄 추가
      "no-trailing-spaces": "error", // 빈 줄 끝에 공백 에러
      "eqeqeq": ["error", "always"], // 같은지 비교시 사용
      "object-curly-spacing": ["error", "always"], // 객체 중괄호 공백 에러
      "no-unused-vars": ["error", { vars: "all", args: "none" }], // 사용하지 않는 변수 에러
      "prefer-const": ["error"], // const 사용 권장
      "no-var": "error", // var 사용 금지
      "max-len": ["error", { code: 120 }], // 줄 길이 120자 이상 에러
      "no-shadow": ["error"], // 변수 중복 선언 에러
      "arrow-body-style": ["error", "as-needed"], // 화살표 함수 본문 스타일 에러
      "no-duplicate-imports": "error", // 중복 임포트 에러
      "prefer-template": "error", // 템플릿 리터럴 사용 권장
      "no-nested-ternary": "error", // 중첩 삼항 연산자 에러
      "spaced-comment": ["error", "always", { exceptions: ["-", "+"] }], // 주석 앞뒤 공백 에러
    },
  },
];
