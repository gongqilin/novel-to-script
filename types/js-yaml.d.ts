// 为 js-yaml 提供简易类型声明（替代 @types/js-yaml）
declare module "js-yaml" {
  export function load(input: string, options?: any): any;
  export function dump(obj: any, options?: any): string;
}
