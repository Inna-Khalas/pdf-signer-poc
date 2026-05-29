/// <reference types="vite/client" />

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.ttf?url' {
  const src: string;
  export default src;
}
